#include <fcntl.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "bugsnag_electron_client_sync.h"
#include "deps/parson/parson.h"
#include "deps/tinycthread/tinycthread.h"
#include "signal_handler.h"

typedef struct {
  // Path to the serialized file on disk
  const char *save_file_path;
  // Max breadcrumbs to save
  uint8_t max_crumbs;
  // The cached JSON object
  JSON_Value *data;
  // The serialized version of the cached JSON object
  char *serialized_data;
  // Length of serialized data in bytes
  size_t serialized_data_len;
  // A lock for synchronizing access to the JSON object
  mtx_t lock;
} becs_context;

// Maximum size for all serialized data
static const int BECS_SERIALIZED_DATA_LEN = 1024 * 1024;
// Local context for storing cached data
static becs_context g_context = {0};
// Field constants
static const char *const key_app = "app";
static const char *const key_breadcrumbs = "breadcrumbs";
static const char *const key_context = "context";
static const char *const key_device = "device";
static const char *const key_metadata = "metadata";
static const char *const key_session = "session";
static const char *const key_user = "user";

static void handle_crash_signal(int sig) {
  becs_persist_to_disk();
  // Uninstall handlers
  becs_signal_uninstall();
  // Invoke previous handler
  becs_signal_raise(sig);
}

static void serialize_data() {
  if (g_context.data) {
    // Cache serialization size, removing trailing null byte
    g_context.serialized_data_len = json_serialization_size(g_context.data) - 1;
    // Serialize object to buffer
    json_serialize_to_buffer(g_context.data, g_context.serialized_data,
                             BECS_SERIALIZED_DATA_LEN);
  }
}

static void context_lock() { mtx_lock(&g_context.lock); }

static void context_unlock() { mtx_unlock(&g_context.lock); }

void becs_install(const char *save_file_path, uint8_t max_crumbs) {
  if (g_context.data != NULL) {
    return;
  }
  // Initialize the locking mechanism
  mtx_init(&g_context.lock, mtx_plain);
  // Cache the save path
  g_context.save_file_path = strdup(save_file_path);
  // Set breadcrumb limit
  g_context.max_crumbs = max_crumbs;

  // Create the initial JSON object for storing cached metadata/breadcrumbs
  g_context.data = json_value_init_object();
  JSON_Object *obj = json_value_get_object(g_context.data);

  // Initialize the breadcrumb array
  json_object_set_value(obj, key_breadcrumbs, json_value_init_array());
  // Initialize metadata object
  json_object_set_value(obj, key_metadata, json_value_init_object());
  // Initialize user object
  json_object_set_value(obj, key_user, json_value_init_object());

  // Allocate a buffer for the serialized JSON string
  g_context.serialized_data = calloc(BECS_SERIALIZED_DATA_LEN, sizeof(char));
  // Cache the empty objects as a JSON string
  serialize_data();
  // Install signal handler
  becs_signal_install(handle_crash_signal);
}

void becs_uninstall() {
  if (!g_context.data) {
    return;
  }
  becs_signal_uninstall();
  free((void *)g_context.save_file_path);
  free(g_context.serialized_data);
  json_value_free(g_context.data);

  g_context.serialized_data_len = 0;
  g_context.data = NULL;
  g_context.save_file_path = NULL;
  g_context.serialized_data = NULL;
}

BECS_STATUS becs_add_breadcrumb(const char *val) {
  if (!g_context.data) {
    return BECS_STATUS_NOT_INSTALLED;
  }
  context_lock();
  BECS_STATUS status = BECS_STATUS_SUCCESS;

  JSON_Object *obj = json_value_get_object(g_context.data);
  JSON_Value *breadcrumb = json_parse_string(val);
  if (!breadcrumb) {
    status = BECS_STATUS_INVALID_JSON;
  } else if (json_value_get_type(breadcrumb) != JSONObject) {
    status = BECS_STATUS_EXPECTED_JSON_OBJECT;
    json_value_free(breadcrumb);
  } else {
    JSON_Value *breadcrumbs_value = json_object_get_value(obj, key_breadcrumbs);
    JSON_Array *breadcrumbs = json_value_get_array(breadcrumbs_value);
    json_array_append_value(breadcrumbs, breadcrumb);
    while (json_array_get_count(breadcrumbs) > g_context.max_crumbs) {
      json_array_remove(breadcrumbs, 0);
    }
    serialize_data();
  }

  context_unlock();
  return status;
}

BECS_STATUS becs_set_context(const char *context) {
  if (!g_context.data) {
    return BECS_STATUS_NOT_INSTALLED;
  }
  context_lock();

  JSON_Object *obj = json_value_get_object(g_context.data);
  if (context) {
    json_object_set_string(obj, key_context, context);
  } else {
    json_object_remove(obj, key_context);
  }

  serialize_data();
  context_unlock();
  return BECS_STATUS_SUCCESS;
}

BECS_STATUS becs_update_metadata(const char *tab, const char *val) {
  if (!g_context.data) {
    return BECS_STATUS_NOT_INSTALLED;
  }

  if (!tab) {
    return BECS_STATUS_NULL_PARAM;
  }

  context_lock();
  BECS_STATUS status = BECS_STATUS_SUCCESS;

  JSON_Object *obj = json_value_get_object(g_context.data);
  JSON_Value *metadata_value = json_object_get_value(obj, "metadata");
  // In the case that something has gone wrong, and metadata does not exist
  // or is the wrong type, replace it with an object. The old resource will be
  // freed automatically if needed.
  if (!metadata_value || json_value_get_type(metadata_value) != JSONObject) {
    metadata_value = json_value_init_object();
    json_object_set_value(obj, "metadata", metadata_value);
  }
  JSON_Object *metadata = json_value_get_object(metadata_value);

  if (val) { // Update the tab contents
    JSON_Value *tab_values = json_parse_string(val);
    if (tab_values) {
      json_object_set_value(metadata, tab, tab_values);
    } else {
      status = BECS_STATUS_INVALID_JSON;
    }
  } else { // Clear the tab contents
    json_object_remove(metadata, tab);
  }

  serialize_data();
  context_unlock();
  return status;
}

BECS_STATUS becs_set_app(const char *value) {
  if (!g_context.data) {
    return BECS_STATUS_NOT_INSTALLED;
  }
  context_lock();
  BECS_STATUS status = BECS_STATUS_SUCCESS;
  JSON_Object *obj = json_value_get_object(g_context.data);
  if (value) {
    JSON_Value *pairs = json_parse_string(value);
    if (!pairs) {
      status = BECS_STATUS_INVALID_JSON;
    } else if (json_value_get_type(pairs) != JSONObject) {
      status = BECS_STATUS_EXPECTED_JSON_OBJECT;
      json_value_free(pairs);
    } else {
      json_object_set_value(obj, key_app, pairs);
    }
  } else {
    json_object_remove(obj, key_app);
  }

  serialize_data();
  context_unlock();
  return status;
}

BECS_STATUS becs_set_device(const char *value) {
  if (!g_context.data) {
    return BECS_STATUS_NOT_INSTALLED;
  }
  context_lock();
  BECS_STATUS status = BECS_STATUS_SUCCESS;
  JSON_Object *obj = json_value_get_object(g_context.data);
  if (value) {
    JSON_Value *pairs = json_parse_string(value);
    if (!pairs) {
      status = BECS_STATUS_INVALID_JSON;
    } else if (json_value_get_type(pairs) != JSONObject) {
      status = BECS_STATUS_EXPECTED_JSON_OBJECT;
      json_value_free(pairs);
    } else {
      json_object_set_value(obj, key_device, pairs);
    }
  } else {
    json_object_remove(obj, key_device);
  }

  serialize_data();
  context_unlock();
  return status;
}

BECS_STATUS becs_set_session(const char *value) {
  if (!g_context.data) {
    return BECS_STATUS_NOT_INSTALLED;
  }
  context_lock();
  BECS_STATUS status = BECS_STATUS_SUCCESS;
  JSON_Object *obj = json_value_get_object(g_context.data);
  if (value) {
    JSON_Value *pairs = json_parse_string(value);
    if (!pairs) {
      status = BECS_STATUS_INVALID_JSON;
    } else if (json_value_get_type(pairs) != JSONObject) {
      status = BECS_STATUS_EXPECTED_JSON_OBJECT;
      json_value_free(pairs);
    } else {
      json_object_set_value(obj, key_session, pairs);
    }
  } else {
    json_object_remove(obj, key_session);
  }

  serialize_data();
  context_unlock();
  return status;
}

BECS_STATUS becs_set_user(const char *id, const char *email, const char *name) {
  if (!g_context.data) {
    return BECS_STATUS_NOT_INSTALLED;
  }
  context_lock();

  JSON_Object *obj = json_value_get_object(g_context.data);
  if (id) {
    json_object_dotset_string(obj, "user.id", id);
  } else {
    json_object_dotremove(obj, "user.id");
  }
  if (email) {
    json_object_dotset_string(obj, "user.email", email);
  } else {
    json_object_dotremove(obj, "user.email");
  }
  if (name) {
    json_object_dotset_string(obj, "user.name", name);
  } else {
    json_object_dotremove(obj, "user.name");
  }

  serialize_data();
  context_unlock();
  return BECS_STATUS_SUCCESS;
}

// Must be async-signal-safe
BECS_STATUS becs_persist_to_disk() {
  if (!g_context.save_file_path) {
    return BECS_STATUS_NOT_INSTALLED;
  }
  // Open save file path
  int fd = open(g_context.save_file_path, O_WRONLY | O_CREAT | O_TRUNC, 0644);
  if (fd == -1) {
    return BECS_STATUS_UNKNOWN_FAILURE;
  }
  // Write serialized_data
  size_t len =
      write(fd, g_context.serialized_data, g_context.serialized_data_len);
  // Close save file path
  close(fd);
  return len == g_context.serialized_data_len ? BECS_STATUS_SUCCESS
                                              : BECS_STATUS_UNKNOWN_FAILURE;
}
