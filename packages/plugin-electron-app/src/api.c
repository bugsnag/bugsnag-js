#include <assert.h>
#include <node_api.h>
#include <stdlib.h>
#include <string.h>

#include "get_version.h"

// If your app version is this long, I have questions, but I also respect your
// choices in life.
static const size_t max_version_length = 512;

static napi_value GetPackageVersion(napi_env env, napi_callback_info info) {
  const char *raw_version = bugsnag_plugin_app_get_package_version();
  if (raw_version) {
    size_t len = strnlen(raw_version, max_version_length);
    napi_value version;
    napi_status status =
        napi_create_string_utf8(env, raw_version, len, &version);
    assert(status == napi_ok);
    free((void *)raw_version);

    return version;
  }

  return NULL;
}

static napi_value GetBundleVersion(napi_env env, napi_callback_info info) {
  const char *raw_version = bugsnag_plugin_app_get_bundle_version();
  if (raw_version) {
    size_t len = strnlen(raw_version, max_version_length);
    napi_value version;
    napi_status status =
        napi_create_string_utf8(env, raw_version, len, &version);
    assert(status == napi_ok);
    free((void *)raw_version);

    return version;
  }

  return NULL;
}

#define DECLARE_NAPI_METHOD(name, func)                                        \
  (napi_property_descriptor) { name, 0, func, 0, 0, 0, napi_default, 0 }

napi_value Init(napi_env env, napi_value exports) {
  napi_property_descriptor desc =
      DECLARE_NAPI_METHOD("getPackageVersion", GetPackageVersion);
  napi_status status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("getBundleVersion", GetBundleVersion);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init);
