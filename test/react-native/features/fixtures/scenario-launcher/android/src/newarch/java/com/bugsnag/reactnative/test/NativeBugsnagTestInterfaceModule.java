package com.reactnative.scenarios;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import com.reactnative.scenarios.NativeBugsnagTestInterfaceSpec;

import java.util.Map;
import java.util.HashMap;

public class NativeBugsnagTestInterfaceModule extends NativeBugsnagTestInterfaceSpec {

  private final BugsnagTestInterfaceImpl impl;

  public NativeBugsnagTestInterfaceModule(ReactApplicationContext reactContext) {
    super(reactContext);
    impl = new BugsnagTestInterfaceImpl(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return BugsnagTestInterfaceImpl.MODULE_NAME;
  }

  @Override
  public void startBugsnag(ReadableMap options, Promise promise) {
    impl.startBugsnag(options, promise);
  }
  
  @Override
  public void runScenario(String scenario, Promise promise) {
    impl.runScenario(scenario, promise);
  }

  @Override
  public boolean runScenarioSync(String scenario) {
    return impl.runScenarioSync(scenario);
  }

  @Override
  public void clearPersistentData() {
    impl.clearPersistentData();
  }
}
