package com.reactnative.scenarios

import android.content.Context
import com.bugsnag.android.Bugsnag
import com.facebook.react.bridge.Promise

class NativePromiseRejectionUnhandledScenario(context: Context): Scenario(context) {

    override fun run(promise: Promise) {
        promise.reject(generateException())
    }
}
