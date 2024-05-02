package com.reactnative.scenarios

import android.content.Context
import com.bugsnag.android.Bugsnag
import com.facebook.react.bridge.Promise

class StartSessionScenario(context: Context): Scenario(context) {

    override fun run(promise: Promise) {
        Bugsnag.startSession()
    }
}
