package com.reactnative.scenarios

import android.content.Context
import com.reactnative.scenarios.Scenario

class ScenarioFactory {

    fun testScenarioForName(scenarioName: String?, context: Context): Scenario {
        val clz = Class.forName("com.reactnative.scenarios.$scenarioName")
        val constructor = clz.constructors[0]
        return constructor.newInstance(context) as Scenario
    }

}
