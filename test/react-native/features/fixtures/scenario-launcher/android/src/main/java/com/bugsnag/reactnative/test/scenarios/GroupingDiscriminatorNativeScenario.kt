package com.reactnative.scenarios

import android.content.Context
import com.bugsnag.android.Bugsnag
import com.facebook.react.bridge.Promise

class GroupingDiscriminatorNativeScenario(context: Context): Scenario(context) {

    override fun run(promise: Promise) {
        val exception = RuntimeException("GroupingDiscriminatorScenarioNative")
        Bugsnag.notify(exception)
        Thread.sleep(500)
        Bugsnag.setGroupingDiscriminator("grouping-discriminator-from-native")
        // JS layer will be automatically notified via the BugsnagReactNativeEmitter
        // when setGroupingDiscriminator is called, which triggers the client observer
    }

    override fun runSync(): Boolean {
        val exception = RuntimeException("GroupingDiscriminatorScenarioNative")
        Bugsnag.notify(exception)
        Thread.sleep(500)
        Bugsnag.setGroupingDiscriminator("grouping-discriminator-from-native")
        return true
    }
}
