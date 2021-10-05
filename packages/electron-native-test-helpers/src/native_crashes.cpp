#include <iostream>
#include <csignal>
#include <stdexcept>

#include <iostream>
#include <exception>
#include <string>
#include <fstream>
#include <assert.h>
#include <node_api.h>

namespace bugsnag_electron_test_helpers {

// Used by ThrowNestedException
// Taken from https://en.cppreference.com/w/cpp/error/throw_with_nested
static void open_file(const std::string& s)
{
    try {
        std::ifstream file(s);
        file.exceptions(std::ios_base::failbit);
    } catch(...) {
        std::throw_with_nested( std::runtime_error("Couldn't open " + s) );
    }
}

static napi_value ThrowCppException(napi_env env, napi_callback_info info) {
  throw std::invalid_argument( "My invalid argument exception" );
}

static napi_value ThrowNestedException(napi_env env, napi_callback_info info) {
  try {
        open_file("nonexistent.file");
    } catch(...) {
        std::throw_with_nested( std::runtime_error("Forced Internal reason for nested exception") );
    }
    return NULL;
}

static napi_value ThrowNumException(napi_env env, napi_callback_info info) {
  throw(20);
  return NULL;
}

static napi_value RaiseAssertion(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_status status = napi_get_cb_info(env, info, &argc, args, NULL, NULL);
  assert(status == napi_ok);

  assert(argc > 1);
  return NULL;
}

static napi_value ThrowNullDereference(napi_env env, napi_callback_info info) {
  char *nullPtr = NULL;
  std::cout << atoi(nullPtr);
  return NULL;
}

#define DECLARE_NAPI_METHOD(name, func) { name, 0, func, 0, 0, 0, napi_default, 0 }

napi_value init(napi_env env, napi_value exports) {
  napi_property_descriptor desc;
  napi_status status;

  desc = DECLARE_NAPI_METHOD("throwCppException", ThrowCppException);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("throwNumException", ThrowNumException);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("raiseAssertion", RaiseAssertion);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("throwNestedException", ThrowNestedException);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  desc = DECLARE_NAPI_METHOD("throwNullDereference", ThrowNullDereference);
  status = napi_define_properties(env, exports, 1, &desc);
  assert(status == napi_ok);

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init)

} //namespace bugsnag_electron_test_helpers

