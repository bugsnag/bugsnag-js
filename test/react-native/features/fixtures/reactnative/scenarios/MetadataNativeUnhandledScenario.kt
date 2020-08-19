package com.reactnative.scenarios

import android.content.Context
import com.bugsnag.android.Bugsnag
import com.bugsnag.android.OnErrorCallback

class MetadataNativeUnhandledScenario(context: Context): Scenario(context) {

    override fun run() {
        super.run()
        Bugsnag.addMetadata("nativedata", "some_more_data", "set via client")
        Bugsnag.addOnError(OnErrorCallback { event ->
            event.addMetadata("nativedata", "even_more_data", "set via event")
            true
        })
        throw generateException()
    }
}
