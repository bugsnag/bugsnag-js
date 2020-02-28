package com.bugsnag.android

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap

class BugsnagReactNative(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    lateinit var plugin: BugsnagReactNativePlugin
    lateinit var logger: Logger

    override fun getName(): String = "BugsnagReactNative"

    private fun logFailure(msg: String) {
        logger.e("Failed to call $msg on bugsnag-plugin-react-native, continuing")
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun configure(): WritableMap {
        return try {
            val client = Bugsnag.getClient()
            logger = client.logger
            plugin = client.getPlugin(BugsnagReactNativePlugin::class.java)!!
            plugin.configure().toWritableMap()
        } catch (exc: Throwable) {
            logFailure("configure")
            WritableNativeMap()
        }
    }

    @ReactMethod
    fun leaveBreadcrumb(map: ReadableMap) {
        try {
            plugin.leaveBreadcrumb(map.toHashMap())
        } catch (exc: Throwable) {
            logFailure("leaveBreadcrumb")
        }
    }

    @ReactMethod
    fun startSession() {
        try {
            plugin.startSession()
        } catch (exc: Throwable) {
            logFailure("startSession")
        }
    }

    @ReactMethod
    fun pauseSession() {
        try {
            plugin.pauseSession()
        } catch (exc: Throwable) {
            logFailure("pauseSession")
        }
    }

    @ReactMethod
    fun resumeSession() {
        try {
            plugin.resumeSession()
        } catch (exc: Throwable) {
            logFailure("resumeSession")
        }
    }

    @ReactMethod
    fun updateContext(context: String?) {
        try {
            plugin.updateContext(context)
        } catch (exc: Throwable) {
            logFailure("updateContext")
        }
    }

    @ReactMethod
    fun updateMetadata(section: String, data: ReadableMap?) {
        try {
            plugin.updateMetadata(section, data?.toHashMap())
        } catch (exc: Throwable) {
            logFailure("updateMetadata")
        }
    }

    @ReactMethod
    fun updateUser(id: String?, email: String?, name: String?) {
        try {
            plugin.updateUser(id, email, name)
        } catch (exc: Throwable) {
            logFailure("updateUser")
        }
    }

    @ReactMethod
    fun dispatch(payload: ReadableMap, promise: Promise) {
        try {
            plugin.dispatch(payload.toHashMap())
            promise.resolve(true)
        } catch (exc: Throwable) {
            logFailure("dispatch")
        }
    }

    @ReactMethod
    fun getPayloadInfo(promise: Promise) {
        try {
            val info = plugin.getPayloadInfo()
            promise.resolve(Arguments.makeNativeMap(info))
        } catch (exc: Throwable) {
            logFailure("getPayloadInfo")
        }
    }
}
