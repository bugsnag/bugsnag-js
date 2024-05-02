package com.reactnative.scenarios

import android.content.Context
import com.facebook.react.bridge.Promise

class AppNativeUnhandledScenario(context: Context): Scenario(context) {

    override fun run(promise: Promise) {
        throw generateException()
    }
}
