package com.reactnative.scenarios

import android.content.Context
import com.bugsnag.android.Bugsnag
import com.bugsnag.android.BreadcrumbType

class BreadcrumbsNativeManualScenario(context: Context): Scenario(context) {

    override fun run() {
        super.run()
        val metadata = mapOf(
            "from" to "android"
        )
        Bugsnag.leaveBreadcrumb("oh native crumbs", metadata, BreadcrumbType.STATE)
        Bugsnag.notify(generateException())
    }
}
