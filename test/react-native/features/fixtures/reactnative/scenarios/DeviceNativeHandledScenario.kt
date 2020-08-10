package com.reactnative.scenarios

import android.content.Context
import com.bugsnag.android.Bugsnag

class DeviceNativeHandledScenario(context: Context): Scenario(context) {

    override fun run() {
        super.run()
        Bugsnag.notify(generateException())
    }
}
