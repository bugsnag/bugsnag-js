package com.bugsnag.reactnative.test;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

// TODO: Do we need @NonNull and @Nullable annotations for function params?
public class BugsnagTestInterfaceModule extends ReactContextBaseJavaModule {
  
  private final BugsnagTestInterfaceImpl impl;

  public BugsnagTestInterfaceModule(ReactApplicationContext context) {
    super(context);
    impl = new BugsnagTestInterfaceImpl(context);
  }

  @Override
  public String getName() {
    return BugsnagTestInterfaceImpl.MODULE_NAME;
  }

  @ReactMethod
  public void clearPersistentData() {
    impl.clearPersistentData();
  }


  @ReactMethod
  public void runScenario(String scenarioName, Promise promise) {
    impl.runScenario(scenarioName, promise);
  }

  @ReactMethod
  public void startBugsnag(ReadableMap options, Promise promise) {
    impl.startBugsnag(options, promise);
  }
}
