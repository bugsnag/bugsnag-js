package com.bugsnag.android;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import kotlin.Unit;
import kotlin.jvm.functions.Function1;

import java.util.Map;

import static com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

public class BugsnagReactNative extends ReactContextBaseJavaModule {

  private final BugsnagReactNativeImpl impl;

  public BugsnagReactNative(ReactApplicationContext reactContext) {
    super(reactContext);
    impl = new BugsnagReactNativeImpl(reactContext);
  }

  @Override
  public String getName() {
    return BugsnagReactNativeImpl.MODULE_NAME;
  }

  @ReactMethod
  public void configureAsync(ReadableMap env, Promise promise) {
    impl.configureAsync(env, promise);
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public WritableMap configure(ReadableMap env) {
    return impl.configure(env);
  }

  @ReactMethod
  void updateCodeBundleId(@Nullable String id) {
    impl.updateCodeBundleId(id);
  }

  @ReactMethod
  void leaveBreadcrumb(@NonNull ReadableMap map) {
    impl.leaveBreadcrumb(map);
  }

  @ReactMethod
  void startSession() {
    impl.startSession();
  }

  @ReactMethod
  void pauseSession() {
    impl.pauseSession();
  }

  @ReactMethod
  void resumeSession() {
    impl.resumeSession();
  }

  @ReactMethod
  void updateContext(@Nullable String context) {
    impl.updateContext(context);
  }

  @ReactMethod
  void addMetadata(@NonNull String section, @Nullable ReadableMap data) {
    impl.addMetadata(section, data);
  }

  @ReactMethod
  void clearMetadata(@NonNull String section, @Nullable String key) {
    impl.clearMetadata(section, key);
  }

  @ReactMethod
  void updateUser(@Nullable String id, @Nullable String email, @Nullable String name) {
    impl.updateUser(id, email, name);
  }

  @ReactMethod
  void dispatch(@NonNull ReadableMap payload, @NonNull Promise promise) {
    impl.dispatch(payload, promise);
  }

  @ReactMethod
  void getPayloadInfo(@NonNull ReadableMap payload, @NonNull Promise promise) {
    impl.getPayloadInfo(payload, promise);
  }

  @ReactMethod
  void addFeatureFlag(@NonNull String name, @Nullable String variant) {
    impl.addFeatureFlag(name, variant);
  }

  @ReactMethod
  void addFeatureFlags(@NonNull ReadableArray flags) {
    impl.addFeatureFlags(flags);
  }

  @ReactMethod
  void clearFeatureFlag(@NonNull String name) {
    impl.clearFeatureFlag(name);
  }

  @ReactMethod
  void clearFeatureFlags() {
    impl.clearFeatureFlags();
  }
}
