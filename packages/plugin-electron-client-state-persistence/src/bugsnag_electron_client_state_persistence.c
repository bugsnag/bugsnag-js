#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#if defined(_WIN32) || defined(__WIN32__) || defined(__WINDOWS__)
#include <io.h>
#else
#include <unistd.h>
#endif

#include "bugsnag_electron_client_state_persistence.h"
#include "deps/parson/parson.h"
#include "deps/tinycthread/tinycthread.h"
#include "crash_handler.h"

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
  // Path to the serialized file on disk
  char *last_run_info_file_path;
  // The cached serialized lastRunInfo JSON object
  char *last_run_info_data;
  // Length of lastRunInfo serialized data in bytes
  size_t last_run_info_data_len;
  // A lock for synchronizing access to the JSON object
  mtx_t lock;
} becsp_context;

// Maximum size for all serialized data
static const int BECSP_SERIALIZED_DATA_LEN = 1024 * 1024;
// Local context for storing cached data
static becsp_context g_context = {0};
// Field constants
static const char *const key_app = "app";
static const char *const key_breadcrumbs = "breadcrumbs";
static const char *const key_context = "context";
static const char *const key_device = "device";
static const char *const key_metadata = "metadata";
static const char *const key_session = "session";
static const char *const key_user = "user";
static const char *const keypath_user_id = "user.id";
static const char *const keypath_user_name = "user.name";
static const char *const keypath_user_email = "user.email";

static void handle_crash(int context) {
  becsp_persist_to_disk();
  bescp_persist_last_run_info_if_required();
  // Uninstall handlers
  becsp_crash_handler_uninstall();
  // Invoke previous handler
  becsp_crash_handler_continue(context);
}

static void serialize_data() {
  if (g_context.data) {
    // Cache serialization size, removing trailing null byte
    g_context.serialized_data_len = json_serialization_size(g_context.data) - 1;
    // Serialize object to buffer
    json_serialize_to_buffer(g_context.data, g_context.serialized_data,
                             BECSP_SERIALIZED_DATA_LEN);
  }
}

static void context_lock() { mtx_lock(&g_context.lock); }

static void context_unlock() { mtx_unlock(&g_context.lock); }

static JSON_Value *initialize_context(const char *state) {
  const char *object_keys[] = {key_metadata, key_session, key_device, key_app,
                               key_user};
  size_t key_count = sizeof(object_keys) / sizeof(const char *);
  if (state) {
    JSON_Value *state_values = json_parse_string(state);
    if (state_values && json_value_get_type(state_values) == JSONObject) {
      JSON_Object *obj = json_value_get_object(state_values);
      // validate known keys for the correct types
      JSON_Value *context = json_object_get_value(obj, key_context);
      if (context && json_value_get_type(context) != JSONString) {
        json_object_remove(obj, key_context);
      }
      JSON_Value *breadcrumbs = json_object_get_value(obj, key_breadcrumbs);
      if (breadcrumbs && json_value_get_type(breadcrumbs) != JSONArray) {
        json_object_remove(obj, key_breadcrumbs);
      }
      for (size_t index = 0; index < key_count; index++) {
        const char *key = object_keys[index];
        JSON_Value *value = json_object_get_value(obj, key);
        if (value && json_value_get_type(value) != JSONObject) {
          json_object_remove(obj, key);
        }
      }
      return state_values;
    }
  }
  return json_value_init_object();
}

void becsp_install(const char *save_file_path,
                  const char *last_run_info_file_path,
                  uint8_t max_crumbs,
                  const char *state) {
  if (g_context.data != NULL) {
    return;
  }
  // Initialize the locking mechanism
  mtx_init(&g_context.lock, mtx_plain);
  // Cache the save path
  g_context.save_file_path = strdup(save_file_path);
  // Cache the lastRunInfo save path
  g_context.last_run_info_file_path = strdup(last_run_info_file_path);
  // Set breadcrumb limit
  g_context.max_crumbs = max_crumbs;

  // Create the initial JSON object for storing cached metadata/breadcrumbs
  g_context.data = initialize_context(state);

  // Allocate a buffer for the serialized JSON string
  g_context.serialized_data = calloc(BECSP_SERIALIZED_DATA_LEN, sizeof(char));
  // Cache the empty objects as a JSON string
  serialize_data();
  // Install crash handler
  becsp_crash_handler_install(handle_crash);
}

void becsp_uninstall() {
  if (!g_context.data) {
    return;
  }
  becsp_crash_handler_uninstall();
  free((void *)g_context.save_file_path);
  free(g_context.serialized_data);
  json_value_free(g_context.data);

  g_context.serialized_data_len = 0;
  g_context.data = NULL;
  g_context.save_file_path = NULL;
  g_context.serialized_data = NULL;
}

BECSP_STATUS becsp_add_breadcrumb(const char *val) {
  if (!g_context.data) {
    return BECSP_STATUS_NOT_INSTALLED;
  }
  context_lock();
  BECSP_STATUS status = BECSP_STATUS_SUCCESS;

  JSON_Object *obj = json_value_get_object(g_context.data);
  JSON_Value *breadcrumb = json_parse_string(val);
  if (!breadcrumb) {
    status = BECSP_STATUS_INVALID_JSON;
  } else if (json_value_get_type(breadcrumb) != JSONObject) {
    status = BECSP_STATUS_EXPECTED_JSON_OBJECT;
    json_value_free(breadcrumb);
  } else {
    JSON_Value *breadcrumbs_value = json_object_get_value(obj, key_breadcrumbs);
    if (!breadcrumbs_value ||
        json_value_get_type(breadcrumbs_value) != JSONArray) {
      // Initialize the breadcrumb array if not yet present or is an invalid
      // type
      json_object_set_value(obj, key_breadcrumbs, json_value_init_array());
    }

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

BECSP_STATUS becsp_set_context(const char *context) {
  if (!g_context.data) {
    return BECSP_STATUS_NOT_INSTALLED;
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
  return BECSP_STATUS_SUCCESS;
}

BECSP_STATUS becsp_set_metadata(const char *values) {
  if (!g_context.data) {
    return BECSP_STATUS_NOT_INSTALLED;
  }

  context_lock();
  BECSP_STATUS status = BECSP_STATUS_SUCCESS;
  JSON_Object *obj = json_value_get_object(g_context.data);

  if (values) {
    JSON_Value *metadata = json_parse_string(values);
    if (metadata) {
      if (json_value_get_type(metadata) == JSONObject) {
        json_object_set_value(obj, key_metadata, metadata);
      } else {
        status = BECSP_STATUS_EXPECTED_JSON_OBJECT;
        json_value_free(metadata);
      }
    } else {
      status = BECSP_STATUS_INVALID_JSON;
    }
  } else {
    json_object_remove(obj, key_metadata);
  }

  serialize_data();
  context_unlock();
  return status;
}

BECSP_STATUS becsp_update_metadata(const char *tab, const char *val) {
  if (!g_context.data) {
    return BECSP_STATUS_NOT_INSTALLED;
  }

  if (!tab) {
    return BECSP_STATUS_NULL_PARAM;
  }

  context_lock();
  BECSP_STATUS status = BECSP_STATUS_SUCCESS;

  JSON_Object *obj = json_value_get_object(g_context.data);
  JSON_Value *metadata_value = json_object_get_value(obj, key_metadata);
  // In the case that something has gone wrong, and metadata does not exist
  // or is the wrong type, replace it with an object. The old resource will be
  // freed automatically if needed.
  if (!metadata_value || json_value_get_type(metadata_value) != JSONObject) {
    metadata_value = json_value_init_object();
    json_object_set_value(obj, key_metadata, metadata_value);
  }
  JSON_Object *metadata = json_value_get_object(metadata_value);

  if (val) { // Update the tab contents
    JSON_Value *tab_values = json_parse_string(val);
    if (tab_values) {
      json_object_set_value(metadata, tab, tab_values);
    } else {
      status = BECSP_STATUS_INVALID_JSON;
    }
  } else { // Clear the tab contents
    json_object_remove(metadata, tab);
  }

  serialize_data();
  context_unlock();
  return status;
}

BECSP_STATUS becsp_set_app(const char *value) {
  if (!g_context.data) {
    return BECSP_STATUS_NOT_INSTALLED;
  }
  context_lock();
  BECSP_STATUS status = BECSP_STATUS_SUCCESS;
  JSON_Object *obj = json_value_get_object(g_context.data);
  if (value) {
    JSON_Value *pairs = json_parse_string(value);
    if (!pairs) {
      status = BECSP_STATUS_INVALID_JSON;
    } else if (json_value_get_type(pairs) != JSONObject) {
      status = BECSP_STATUS_EXPECTED_JSON_OBJECT;
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

BECSP_STATUS becsp_set_device(const char *value) {
  if (!g_context.data) {
    return BECSP_STATUS_NOT_INSTALLED;
  }
  context_lock();
  BECSP_STATUS status = BECSP_STATUS_SUCCESS;
  JSON_Object *obj = json_value_get_object(g_context.data);
  if (value) {
    JSON_Value *pairs = json_parse_string(value);
    if (!pairs) {
      status = BECSP_STATUS_INVALID_JSON;
    } else if (json_value_get_type(pairs) != JSONObject) {
      status = BECSP_STATUS_EXPECTED_JSON_OBJECT;
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

BECSP_STATUS becsp_set_session(const char *value) {
  if (!g_context.data) {
    return BECSP_STATUS_NOT_INSTALLED;
  }
  context_lock();
  BECSP_STATUS status = BECSP_STATUS_SUCCESS;
  JSON_Object *obj = json_value_get_object(g_context.data);
  if (value) {
    JSON_Value *pairs = json_parse_string(value);
    if (!pairs) {
      status = BECSP_STATUS_INVALID_JSON;
    } else if (json_value_get_type(pairs) != JSONObject) {
      status = BECSP_STATUS_EXPECTED_JSON_OBJECT;
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

BECSP_STATUS becsp_set_user(const char *id, const char *email, const char *name) {
  if (!g_context.data) {
    return BECSP_STATUS_NOT_INSTALLED;
  }
  context_lock();

  JSON_Object *obj = json_value_get_object(g_context.data);
  if (id) {
    json_object_dotset_string(obj, keypath_user_id, id);
  } else {
    json_object_dotremove(obj, keypath_user_id);
  }
  if (email) {
    json_object_dotset_string(obj, keypath_user_email, email);
  } else {
    json_object_dotremove(obj, keypath_user_email);
  }
  if (name) {
    json_object_dotset_string(obj, keypath_user_name, name);
  } else {
    json_object_dotremove(obj, keypath_user_name);
  }

  serialize_data();
  context_unlock();
  return BECSP_STATUS_SUCCESS;
}

BECSP_STATUS becsp_set_last_run_info(const char *encoded_json) {
  if (!g_context.data) {
    return BECSP_STATUS_NOT_INSTALLED;
  }
  context_lock();

  // release the previously cached lastRunInfo string (if there is one)
  if(g_context.last_run_info_data) {
    g_context.last_run_info_data_len = 0;
    free(g_context.last_run_info_data);
  }

  g_context.last_run_info_data = encoded_json;
  g_context.last_run_info_data_len = strlen(encoded_json);

  context_unlock();
  return BECSP_STATUS_SUCCESS;
}

// Must be async-signal-safe
BECSP_STATUS becsp_persist_to_disk() {
  if (!g_context.save_file_path) {
    return BECSP_STATUS_NOT_INSTALLED;
  }
  // Open save file path
  int fd = open(g_context.save_file_path, O_WRONLY | O_CREAT | O_TRUNC, 0644);
  if (fd == -1) {
    return BECSP_STATUS_UNKNOWN_FAILURE;
  }
  // Write serialized_data
  size_t len =
      write(fd, g_context.serialized_data, g_context.serialized_data_len);
  // Close save file path
  close(fd);
  return len == g_context.serialized_data_len ? BECSP_STATUS_SUCCESS
                                              : BECSP_STATUS_UNKNOWN_FAILURE;
}

// Must be async-signal-safe - save the lastRunInfo set for a crash
BECSP_STATUS bescp_persist_last_run_info_if_required() {
  if(!g_context.last_run_info_file_path) {
    return BECSP_STATUS_NOT_INSTALLED;
  }

  if(!g_context.last_run_info_data || g_context.last_run_info_data_len == 0) {
    return BECSP_STATUS_SUCCESS;
  }

  int fd = open(g_context.last_run_info_file_path, O_WRONLY | O_CREAT | O_TRUNC, 0644);
  if (fd == -1) {
    return BECSP_STATUS_UNKNOWN_FAILURE;
  }
  // Write last_run_info
  write(fd, g_context.last_run_info_data, g_context.last_run_info_data_len);
  // Close last_run_info file
  close(fd);

  return BECSP_STATUS_SUCCESS;
}
