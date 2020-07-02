package com.<ANDROID_PACKAGE_PATH>.scenarios

import android.content.Context
import com.bugsnag.android.Bugsnag

class AppNativeHandledScenario(context: Context): Scenario(context) {

    override fun run() {
        super.run()
        Bugsnag.notify(generateException())
    }
}
