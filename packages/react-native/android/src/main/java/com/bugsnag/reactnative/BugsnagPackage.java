package com.bugsnag.reactnative;

import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.ReactPackage;
import java.util.List;
import java.util.Collections;
import java.util.Arrays;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;

public class BugsnagPackage implements ReactPackage {

  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @SuppressWarnings("rawtypes") // the ReactPackage interface uses a raw type, ignore it
  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    return Arrays.<NativeModule>asList(new BugsnagReactNative(reactContext));
  }
}
