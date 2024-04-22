package com.bugsnag.reactnative.test

import android.content.Context
import com.bugsnag.android.Bugsnag
import com.bugsnag.android.BreadcrumbType
import com.facebook.react.bridge.Promise

class BreadcrumbsNativeManualScenario(context: Context): Scenario(context) {

    override fun run(promise: Promise) {
        val metadata = mapOf(
            "from" to "android"
        )
        Bugsnag.leaveBreadcrumb("oh native crumbs", metadata, BreadcrumbType.STATE)
        Bugsnag.notify(generateException())
    }
}
