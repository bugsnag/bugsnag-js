package com.reactnative.scenarios

import android.content.Context
import com.bugsnag.android.Bugsnag

class ResumeSessionScenario(context: Context): Scenario(context) {

    override fun run() {
        super.run()
        Bugsnag.resumeSession()
    }
}
