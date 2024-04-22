package com.bugsnag.reactnative.test

import android.content.Context
import com.bugsnag.reactnative.test.Scenario

class ScenarioFactory {

    fun testScenarioForName(scenarioName: String?, context: Context): Scenario {
        val clz = Class.forName("com.bugsnag.reactnative.test.$scenarioName")
        val constructor = clz.constructors[0]
        return constructor.newInstance(context) as Scenario
    }

}
