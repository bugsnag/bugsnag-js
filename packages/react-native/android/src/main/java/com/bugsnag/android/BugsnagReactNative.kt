package com.bugsnag.android

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter

class BugsnagReactNative(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    lateinit var bridge: RCTDeviceEventEmitter
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
            bridge = reactContext.getJSModule(RCTDeviceEventEmitter::class.java)
            logger = client.logger
            plugin = client.getPlugin(BugsnagReactNativePlugin::class.java)!!
            plugin.registerForMessageEvents { emitEvent(it) }
            plugin.configure().toWritableMap()
        } catch (exc: Throwable) {
            logFailure("configure", exc)
            WritableNativeMap()
        }
    }

    /**
     * Serializes a MessageEvent into a WritableMap and sends it across the React Bridge
     */
    private fun emitEvent(event: MessageEvent) {
        logger.d("Received MessageEvent: ${event.type}")

        val map = Arguments.createMap()
        map.putString("type", event.type)

        when (event.type) {
            "ContextUpdate" -> map.putString("data", event.data as String?)
            "UserUpdate" -> map.putMap("data", Arguments.makeNativeMap(event.data as Map<String, Any?>?))
            "MetadataUpdate" -> map.putMap("data", Arguments.makeNativeMap(event.data as Map<String, Any?>?))
            else -> logger.w("Received unknown message event ${event.type}, ignoring")
        }
        bridge.emit("bugsnag::sync", map)
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
