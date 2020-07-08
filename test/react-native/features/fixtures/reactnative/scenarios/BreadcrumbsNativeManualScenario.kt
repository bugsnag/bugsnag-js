package com.reactnative.scenarios

import android.content.Context
import com.bugsnag.android.Bugsnag

class BreadcrumbsNativeManualScenario(context: Context): Scenario(context) {

    override fun run() {
        super.run()
        Bugsnag.leaveBreadcrumb("oh native crumbs")
        Bugsnag.notify(generateException())
    }
}
