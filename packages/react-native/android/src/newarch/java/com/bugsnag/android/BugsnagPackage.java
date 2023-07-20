package com.bugsnag.android;

import androidx.annotation.Nullable;

import java.util.Collections;
import java.util.Map;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.TurboReactPackage;

public class BugsnagPackage extends TurboReactPackage {

  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    if (name.equals(BugsnagReactNativeImpl.MODULE_NAME)) {
      return new NativeBugsnagImpl(reactContext);
    } else {
      return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return new ReactModuleInfoProvider() {
      public Map<String, ReactModuleInfo> getReactModuleInfos() {
        return Collections.singletonMap(
          BugsnagReactNativeImpl.MODULE_NAME,
          new ReactModuleInfo(
            BugsnagReactNativeImpl.MODULE_NAME,
            BugsnagReactNativeImpl.MODULE_NAME,
            false, // canOverrideExistingModule
            true,  // needsEagerInit
            false, // hasConstants
            false, // isCxxModule
            true   // isTurboModule
          )
        );
      }
    };
  }
}
