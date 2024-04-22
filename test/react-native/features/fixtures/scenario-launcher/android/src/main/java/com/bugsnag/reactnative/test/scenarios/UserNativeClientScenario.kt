package com.bugsnag.reactnative.test

import android.content.Context
import com.bugsnag.android.Bugsnag
import com.facebook.react.bridge.Promise

class UserNativeClientScenario(context: Context): Scenario(context) {

    override fun run(promise: Promise) {
        Bugsnag.setUser("123", "bug@sn.ag", "Bug Snag")
        throw generateException()
    }
}
