package com.reactnative.scenarios

import android.content.Context
import com.bugsnag.android.Bugsnag
import com.facebook.react.bridge.Promise

class NativeFeatureFlagsScenario(context: Context): Scenario(context) {

  override fun run(promise: Promise) {
    Bugsnag.clearFeatureFlag("should_not_be_reported_1")
    Bugsnag.clearFeatureFlag("should_not_be_reported_2")
    Bugsnag.clearFeatureFlag("should_not_be_reported_3")

    Bugsnag.addFeatureFlag("native_flag")
  }
}
