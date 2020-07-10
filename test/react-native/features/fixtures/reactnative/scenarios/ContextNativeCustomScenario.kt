package com.reactnative.scenarios

import android.content.Context
import com.bugsnag.android.Bugsnag

class ContextNativeCustomScenario(context: Context): Scenario(context) {

    override fun run() {
        super.run()
        Bugsnag.notify(generateException())
        Thread.sleep(500)
        Bugsnag.setContext("context-native")
        Bugsnag.notify(generateException())
    }
}
