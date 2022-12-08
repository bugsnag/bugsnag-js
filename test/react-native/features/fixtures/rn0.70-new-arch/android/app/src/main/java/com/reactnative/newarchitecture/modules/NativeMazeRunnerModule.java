package com.reactnative.newarchitecture.modules;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.fbreact.specs.NativeMazeRunnerModuleSpec;

public class NativeMazeRunnerModule extends NativeMazeRunnerModuleSpec {
  public static final String NAME = "MazeRunner";

  public NativeMazeRunnerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @Override
  public void getMessage(String a, Promise promise) {
    Log.i("Bugsnag", "getMessage(" + a + ") was called *yay*");
    promise.resolve("message: " + a);
  }
}
