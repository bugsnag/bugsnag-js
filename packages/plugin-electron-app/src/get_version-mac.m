#import <Foundation/Foundation.h>

#import <stdlib.h>
#import <string.h>

const char *bugsnag_plugin_app_get_package_version() {
  // if any of the intermediate values (mainBundle, infoDictionary, etc) are
  // nil, the entire chain evaluates to nil
  const char *value =
      [[[NSBundle mainBundle] infoDictionary][@"CFBundleVersion"] UTF8String];
  if (value) {
    // copy the value as the existing reference will likely be invalidated in
    // the immediate future
    //
    // > Discussion:
    // >   This C string is a pointer to a structure inside the string object,
    // >   which may have a lifetime shorter than the string object and will
    // >   certainly not have a longer lifetime. Therefore, you should copy the
    // >   C string if it needs to be stored outside of the memory context in
    // >   which you use this property.
    //
    // from
    // https://developer.apple.com/documentation/foundation/nsstring/1411189-utf8string?language=objc
    value = strdup(value);
  }

  return value;
}
