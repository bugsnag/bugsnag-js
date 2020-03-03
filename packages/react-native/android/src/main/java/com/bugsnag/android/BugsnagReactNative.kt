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

    private fun logFailure(msg: String, exc: Throwable) {
        logger.e("Failed to call $msg on bugsnag-plugin-react-native, continuing", exc)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    private fun configure(): WritableMap {
        return try {
            val client = Bugsnag.getClient()
            logger = client.logger
            plugin = client.getPlugin(BugsnagReactNativePlugin::class.java)!!
            plugin.configure().toWritableMap()
        } catch (exc: Throwable) {
            logFailure("configure", exc)
            WritableNativeMap()
        }
    }

    @ReactMethod
    private fun leaveBreadcrumb(map: ReadableMap) {
        try {
            plugin.leaveBreadcrumb(map.toHashMap())
        } catch (exc: Throwable) {
            logFailure("leaveBreadcrumb", exc)
        }
    }

    @ReactMethod
    private fun startSession() {
        try {
            plugin.startSession()
        } catch (exc: Throwable) {
            logFailure("startSession", exc)
        }
    }

    @ReactMethod
    private fun pauseSession() {
        try {
            plugin.pauseSession()
        } catch (exc: Throwable) {
            logFailure("pauseSession", exc)
        }
    }

    @ReactMethod
    private fun resumeSession() {
        try {
            plugin.resumeSession()
        } catch (exc: Throwable) {
            logFailure("resumeSession", exc)
        }
    }

    @ReactMethod
    private fun updateContext(context: String?) {
        try {
            plugin.updateContext(context)
        } catch (exc: Throwable) {
            logFailure("updateContext", exc)
        }
    }

    @ReactMethod
    private fun updateMetadata(section: String, data: ReadableMap?) {
        try {
            plugin.updateMetadata(section, data?.toHashMap())
        } catch (exc: Throwable) {
            logFailure("updateMetadata", exc)
        }
    }

    @ReactMethod
    private fun updateUser(id: String?, email: String?, name: String?) {
        try {
            plugin.updateUser(id, email, name)
        } catch (exc: Throwable) {
            logFailure("updateUser", exc)
        }
    }

    @ReactMethod
    private fun dispatch(payload: ReadableMap, promise: Promise) {
        try {
            plugin.dispatch(payload.toHashMap())
            promise.resolve(true)
        } catch (exc: Throwable) {
            logFailure("dispatch", exc)
            promise.resolve(false)
        }
    }

    @ReactMethod
    private fun getPayloadInfo(payload: ReadableMap, promise: Promise) {
        try {
            val unhandled = payload.getBoolean("unhandled")
            val info = plugin.getPayloadInfo(unhandled)
            promise.resolve(Arguments.makeNativeMap(info))
        } catch (exc: Throwable) {
            logFailure("getPayloadInfo", exc)
        }
    }
}
