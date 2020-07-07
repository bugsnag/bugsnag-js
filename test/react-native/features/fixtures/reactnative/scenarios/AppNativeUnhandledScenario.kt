package com.reactnative.scenarios

import android.content.Context

class AppNativeUnhandledScenario(context: Context): Scenario(context) {

    override fun run() {
        super.run()
        throw generateException()
    }
}
