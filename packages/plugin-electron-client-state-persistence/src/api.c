#include <assert.h>
#include <node_api.h>
#include <signal.h>
#include <stdbool.h>
#include <stdlib.h>

#include "bugsnag_electron_client_state_persistence.h"

static napi_value json_stringify(napi_env env, napi_value json_obj) {
  napi_value global;
  napi_status status = napi_get_global(env, &global);
  assert(status == napi_ok);

  napi_value JSON;
  status = napi_get_named_property(env, global, "JSON", &JSON);
  assert(status == napi_ok);

  napi_value stringify;
  status = napi_get_named_property(env, JSON, "stringify", &stringify);
  assert(status == napi_ok);

  napi_value argv[] = {json_obj};
  napi_value result;
  status = napi_call_function(env, JSON, stringify, 1, argv, &result);
  assert(status == napi_ok);

  return result;
}

static char *read_string_value(napi_env env, napi_value arg, bool allow_null) {
  napi_valuetype valuetype;
  napi_status status = napi_typeof(env, arg, &valuetype);
  assert(status == napi_ok);

  switch (valuetype) {
  case napi_string: {
    size_t len;
    status = napi_get_value_string_utf8(env, arg, NULL, 0, &len);
    assert(status == napi_ok);

    char *string = calloc(len + 1, sizeof(char));
    status = napi_get_value_string_utf8(env, arg, string, len + 1, NULL);
    assert(status == napi_ok);

    return string;
  }
  case napi_null:
    if (allow_null) {
      return NULL;
    }
    // fall through
  default:
    napi_throw_type_error(env, NULL, "Wrong argument type, expected string");
  }

  return NULL;
}

static char *read_json_string_value(napi_env env, napi_value arg,
                                    bool allow_null) {
  napi_valuetype valuetype;
  napi_status status = napi_typeof(env, arg, &valuetype);
  assert(status == napi_ok);

  switch (valuetype) {
  case napi_object:
    return read_string_value(env, json_stringify(env, arg), allow_null);
  case napi_string:
    return read_string_value(env, arg, allow_null);
  case napi_null:
    if (allow_null) {
      return NULL;
    }
  default:
    napi_throw_type_error(env, NULL,
                          "Wrong argument type, expected object or string");
    return NULL;
  }
}

static bool throw_error_from_status(napi_env env, BECSP_STATUS status) {
  const char *code = "BugsnagSyncError";
  switch (status) {
  case BECSP_STATUS_SUCCESS:
    return false;
  case BECSP_STATUS_INVALID_JSON:
    napi_throw_error(env, code, "Failed to convert argument to JSON");
    break;
  case BECSP_STATUS_EXPECTED_JSON_OBJECT:
    napi_throw_type_error(env, code, "Wrong argument type, expected object");
    break;
  case BECSP_STATUS_NULL_PARAM:
    napi_throw_type_error(env, code, "Expected argument to be non-null");
    break;
  case BECSP_STATUS_NOT_INSTALLED:
    napi_throw_error(env, code,
                     "Sync layer is not installed, first call install()");
    break;
  case BECSP_STATUS_UNKNOWN_FAILURE:
    napi_throw_error(env, code, "Failed to synchronize data");
    break;
  }
  return true;
}

static void set_object_or_null(napi_env env, napi_value obj,
                               BECSP_STATUS (*setter)(const char *)) {
  napi_valuetype valuetype;
  napi_status status = napi_typeof(env, obj, &valuetype);
  assert(status == napi_ok);

  switch (valuetype) {
  case napi_null:
    setter(NULL);
    break;
  case napi_object: {
    char *value = read_string_value(env, json_stringify(env, obj), false);
    if (value) {
      throw_error_from_status(env, setter(value));
      free(value);
    } else {
      throw_error_from_status(env, BECSP_STATUS_INVALID_JSON);
    }
  } break;
  default:
    napi_throw_type_error(env, NULL, "Wrong argument type, expected object");
  }
}

static napi_value Uninstall(napi_env env, napi_callback_info info) {
  becsp_uninstall();
  return NULL;
}

static napi_value Install(napi_env env, napi_callback_info info) {
  size_t argc = 4;
  napi_value args[4];
  napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  assert(status == napi_ok);

  if (argc < 3) {
    napi_throw_type_error(env, NULL,
                          "Wrong number of arguments, expected 3 or 4");
    return NULL;
  }

  napi_valuetype valuetype0;
  status = napi_typeof(env, args[0], &valuetype0);
  assert(status == napi_ok);

  napi_valuetype valuetype1;
  status = napi_typeof(env, args[1], &valuetype1);
  assert(status == napi_ok);

  napi_valuetype valuetype2;
  status = napi_typeof(env, args[2], &valuetype2);
  assert(status == napi_ok);

  if (valuetype0 != napi_string || valuetype1 != napi_string || valuetype2 != napi_number) {
    napi_throw_type_error(
        env, NULL, "Wrong argument types, expected (string, string, number, object?)");
    return NULL;
  }

  char *filepath = read_string_value(env, args[0], false);
  if (!filepath) {
    return NULL;
  }

  char *lastRunInfoFilePath = read_string_value(env, args[1], false);
  if (!lastRunInfoFilePath) {
    return NULL;
  }

  double max_crumbs;
  status = napi_get_value_double(env, args[2], &max_crumbs);
  assert(status == napi_ok);

  if (argc > 3) {
    napi_valuetype valuetype3;
    status = napi_typeof(env, args[3], &valuetype3);
    assert(status == napi_ok);

    if (valuetype3 == napi_object) {
      char *state = read_string_value(env, json_stringify(env, args[3]), true);
      becsp_install(filepath, lastRunInfoFilePath, max_crumbs, state);
      free(state);
    } else {
      napi_throw_type_error(
          env, NULL,
          "Wrong argument types, expected (string, string, number, object?)");
    }
  } else {
    becsp_install(filepath, lastRunInfoFilePath, max_crumbs, NULL);
  }

  free(filepath);

  return NULL;
}

static napi_value UpdateContext(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  assert(status == napi_ok);

  if (argc < 1) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments, expected 1");
    return NULL;
  }

  napi_valuetype valuetype0;
  status = napi_typeof(env, args[0], &valuetype0);
  assert(status == napi_ok);

  if (valuetype0 == napi_string) {
    char *context = read_string_value(env, args[0], false);
    throw_error_from_status(env, becsp_set_context(context));
    free(context);
  } else if (valuetype0 == napi_null) {
    becsp_set_context(NULL);
  } else {
    napi_throw_type_error(env, NULL,
                          "Wrong argument type, expected string or null");
  }

  return NULL;
}

static napi_value UpdateUser(napi_env env, napi_callback_info info) {
  size_t argc = 3;
  napi_value args[3];
  napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  assert(status == napi_ok);

  if (argc < 3) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments, expected 3");
    return NULL;
  }

  char *id = read_string_value(env, args[0], true);
  char *email = read_string_value(env, args[1], true);
  char *name = read_string_value(env, args[2], true);
  throw_error_from_status(env, becsp_set_user(id, email, name));

  free(id);
  free(email);
  free(name);

  return NULL;
}

static void UpdateMetadataTab(napi_env env, size_t argc, napi_value *args) {
  char *tab = read_string_value(env, args[0], false);
  if (!tab) {
    return; // if null, error was thrown upstream
  }

  bool should_clear = false;
  if (argc == 1) {
    should_clear = true;
  } else {
    napi_valuetype valuetype1;
    napi_status status = napi_typeof(env, args[1], &valuetype1);
    assert(status == napi_ok);
    should_clear = valuetype1 == napi_null;
  }

  if (should_clear) { // clearing the tab
    throw_error_from_status(env, becsp_update_metadata(tab, NULL));
  } else {
    char *values = read_string_value(env, json_stringify(env, args[1]), true);
    if (values) {
      throw_error_from_status(env, becsp_update_metadata(tab, values));
      free(values);
    }
  }

  free(tab);
}

static napi_value UpdateMetadata(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  assert(status == napi_ok);

  if (argc < 1) {
    napi_throw_type_error(env, NULL,
                          "Wrong number of arguments, expected 1 or 2");
    return NULL;
  }

  napi_valuetype valuetype0;
  status = napi_typeof(env, args[0], &valuetype0);
  assert(status == napi_ok);

  switch (valuetype0) {
  case napi_object: { // setting all metadata
    char *metadata = read_string_value(env, json_stringify(env, args[0]), true);
    throw_error_from_status(env, becsp_set_metadata(metadata));
    free(metadata);
  }; break;
  case napi_string: { // setting / clearing a single tab
    UpdateMetadataTab(env, argc, args);
  }; break;
  default:
    napi_throw_type_error(
        env, NULL,
        "Wrong argument types, expected (object) or (string, object?)");
    break;
  }

  return NULL;
}

static napi_value SetApp(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  assert(status == napi_ok);

  if (argc < 1) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments, expected 1");
    return NULL;
  }

  set_object_or_null(env, args[0], becsp_set_app);

  return NULL;
}

static napi_value SetDevice(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  assert(status == napi_ok);

  if (argc < 1) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments, expected 1");
    return NULL;
  }

  set_object_or_null(env, args[0], becsp_set_device);

  return NULL;
}

static napi_value SetSession(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  assert(status == napi_ok);

  if (argc < 1) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments, expected 1");
    return NULL;
  }

  set_object_or_null(env, args[0], becsp_set_session);

  return NULL;
}

static napi_value LeaveBreadcrumb(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  assert(status == napi_ok);

  if (argc < 1) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments, expected 1");
    return NULL;
  }

  char *breadcrumb = read_json_string_value(env, args[0], false);
  if (breadcrumb) {
    throw_error_from_status(env, becsp_add_breadcrumb(breadcrumb));
    free(breadcrumb);
  }

  return NULL;
}

static napi_value PersistState(napi_env env, napi_callback_info info) {
  becsp_persist_to_disk();
  return NULL;
}

static napi_value SetLastRunInfo(napi_env env, napi_callback_info info) {
  char *lastRunInfo;
  size_t argc = 1;
  napi_value args[1];
  napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  assert(status == napi_ok);

  if (argc < 1) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments, expected 1");
    return NULL;
  }

  lastRunInfo = read_string_value(env, args[0], false);

  becsp_set_last_run_info(lastRunInfo);
  return NULL;
}

static napi_value PersistLastRunInfo(napi_env env, napi_callback_info info) {
  bescp_persist_last_run_info_if_required();
  return NULL;
}

#define DECLARE_NAPI_METHOD(name, func)                                        \
  (napi_property_descriptor) { name, 0, func, 0, 0, 0, napi_default, 0 }

napi_value Init(napi_env env, napi_value exports) {
  napi_property_descriptor desc = DECLARE_NAPI_METHOD("install", Install);
  napi_status status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("updateMetadata", UpdateMetadata);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("leaveBreadcrumb", LeaveBreadcrumb);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("updateContext", UpdateContext);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("updateUser", UpdateUser);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("persistState", PersistState);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("setApp", SetApp);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("setDevice", SetDevice);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("setSession", SetSession);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("setLastRunInfo", SetLastRunInfo);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("persistLstRunInfo", PersistLastRunInfo);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("uninstall", Uninstall);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init);
