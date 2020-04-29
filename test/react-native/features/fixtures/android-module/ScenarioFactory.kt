package com.<ANDROID_PACKAGE_PATH>

import android.content.Context
import com.<ANDROID_PACKAGE_PATH>.scenarios.Scenario

class ScenarioFactory {

    fun testScenarioForName(scenarioName: String?, context: Context): Scenario {
        val clz = Class.forName("com.<ANDROID_PACKAGE_PATH>.scenarios.$scenarioName")
        val constructor = clz.constructors[0]
        return constructor.newInstance(context) as Scenario
    }

}
