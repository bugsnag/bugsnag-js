package com.<ANDROID_PACKAGE_PATH>.scenarios

import android.content.Context

class UnhandledNativeErrorScenario(context: Context): Scenario(context) {

    override fun run() {
        super.run()
        throw generateException()
    }
}
