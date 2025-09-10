package com.reactnative.scenarios

import android.content.Context
import com.facebook.react.bridge.Promise

class GroupingDiscriminatorScenario(context: Context): Scenario(context) {

    override fun run(promise: Promise) {
        // This scenario is driven from the JS side
        // The native part doesn't need to do anything specific
    }
}
