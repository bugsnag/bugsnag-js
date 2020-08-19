package com.reactnative.scenarios

import android.content.Context

class DeviceNativeUnhandledScenario(context: Context): Scenario(context) {

    override fun run() {
        super.run()
        throw generateException()
    }
}
