package com.bugsnag.reactnative.test

import android.content.Context
import com.bugsnag.android.Bugsnag
import com.facebook.react.bridge.Promise

class ContextNativeCustomScenario(context: Context): Scenario(context) {

    override fun run(promise: Promise) {
        Bugsnag.notify(generateException())
        Thread.sleep(500)
        Bugsnag.setContext("context-native")
        Bugsnag.notify(RuntimeException(javaClass.simpleName + "2"))
    }
}
