package com.<ANDROID_PACKAGE_PATH>.scenarios

import android.app.Activity
import android.app.Application
import android.os.Bundle
import android.content.Context

abstract class Scenario(
    protected val context: Context
): Application.ActivityLifecycleCallbacks {

    open fun run() {

    }

    /**
     * Returns a throwable with the message as the current classname
     */
    protected fun generateException(): Throwable = RuntimeException(javaClass.simpleName)


    /* Activity lifecycle callback overrides */

    protected fun registerActivityLifecycleCallbacks() {
        (context.applicationContext as Application).registerActivityLifecycleCallbacks(this)
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
    override fun onActivityStarted(activity: Activity) {}
    override fun onActivityResumed(activity: Activity) {}
    override fun onActivityPaused(activity: Activity) {}
    override fun onActivityStopped(activity: Activity) {}
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle?) {}
    override fun onActivityDestroyed(activity: Activity) {}

}
