package com.bugsnag.android;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import com.bugsnag.android.NativeBugsnagSpec;

import javax.annotation.Nullable;

public class NativeBugsnagImpl extends NativeBugsnagSpec {
  private final BugsnagReactNativeImpl impl;

  public NativeBugsnagImpl(ReactApplicationContext reactContext) {
    super(reactContext);
    impl = new BugsnagReactNativeImpl(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return BugsnagReactNativeImpl.MODULE_NAME;
  }

  @Override
  public void configureAsync(ReadableMap configuration, Promise promise) {
    impl.configureAsync(configuration, promise);
  }

  @Override
  public WritableMap configure(ReadableMap configuration) {
    return impl.configure(configuration);
  }

  @Override
  public void updateCodeBundleId(@Nullable String id) {
    impl.updateCodeBundleId(id);
  }

  @Override
  public void leaveBreadcrumb(ReadableMap breadcrumb) {
    impl.leaveBreadcrumb(breadcrumb);
  }

  @Override
  public void startSession() {
    impl.startSession();
  }

  @Override
  public void pauseSession() {
    impl.pauseSession();
  }

  @Override
  public void resumeSession() {
    impl.resumeSession();
  }

  @Override
  public void resumeSessionOnStartup() {
    impl.resumeSessionOnStartup();
  }

  @Override
  public void updateContext(@Nullable String context) {
    impl.updateContext(context);
  }

  @Override
  public void addMetadata(String section, ReadableMap metadata) {
    impl.addMetadata(section, metadata);
  }

  @Override
  public void clearMetadata(String section, @Nullable String key) {
    impl.clearMetadata(section, key);
  }

  @Override
  public void updateUser(@Nullable String id, @Nullable String email, @Nullable String name) {
    impl.updateUser(id, email, name);
  }

  @Override
  public boolean dispatch(ReadableMap payload) {
    return impl.dispatch(payload);
  }

  @Override
  public void dispatchAsync(ReadableMap payload, Promise promise) {
    impl.dispatchAsync(payload, promise);
  }

  @Override
  public WritableMap getPayloadInfo(ReadableMap payload) {
    return impl.getPayloadInfo(payload);
  }

  @Override
  public void getPayloadInfoAsync(ReadableMap payload, Promise promise) {
    impl.getPayloadInfoAsync(payload, promise);
  }

  @Override
  public void addFeatureFlag(String name, @Nullable String variant) {
    impl.addFeatureFlag(name, variant);
  }

  @Override
  public void addFeatureFlags(ReadableArray featureFlags) {
    impl.addFeatureFlags(featureFlags);
  }

  @Override
  public void clearFeatureFlag(String name) {
    impl.clearFeatureFlag(name);
  }

  @Override
  public void clearFeatureFlags() {
    impl.clearFeatureFlags();
  }
}
