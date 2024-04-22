package com.bugsnag.reactnative.test

import android.content.Context
import com.bugsnag.android.Bugsnag
import com.facebook.react.bridge.Promise

class MetadataNativeScenario(context: Context): Scenario(context) {

    override fun run(promise: Promise) {
        Bugsnag.addMetadata("nativedata", "some_more_data", "set via client")
        Bugsnag.notify(generateException(), { event ->
            event.addMetadata("nativedata", "even_more_data", "set via event")
            true
        })
    }
}
