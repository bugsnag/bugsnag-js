package com.reactnative.scenarios

import android.content.Context
import com.bugsnag.android.Bugsnag

class UserNativeClientScenario(context: Context): Scenario(context) {

    override fun run() {
        super.run()
        Bugsnag.setUser("123", "bug@sn.ag", "Bug Snag")
        throw generateException()
    }
}
