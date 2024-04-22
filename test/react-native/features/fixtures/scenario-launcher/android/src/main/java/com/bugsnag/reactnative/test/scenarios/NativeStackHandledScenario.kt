package com.bugsnag.reactnative.test

import android.content.Context
import com.bugsnag.android.Bugsnag
import com.facebook.react.bridge.Promise

class NativeStackHandledScenario(context: Context): Scenario(context) {

    override fun run(promise: Promise) {
        promise.reject(generateException())
    }
}
