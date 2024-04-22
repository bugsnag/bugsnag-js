package com.bugsnag.reactnative.test

import android.content.Context
import com.facebook.react.bridge.Promise

class DeviceNativeUnhandledScenario(context: Context): Scenario(context) {

    override fun run(promise: Promise) {
        throw generateException()
    }
}
