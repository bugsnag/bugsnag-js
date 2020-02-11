package com.bugsnag.reactnative

import com.bugsnag.android.Client
import com.bugsnag.android.InternalHooks
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap

class BugsnagReactNative(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val configSerializer = ConfigSerializer()
    internal lateinit var client: Client

    @ReactMethod(isBlockingSynchronousMethod = true)
    private fun configure(): WritableMap {
        try {
            // see if bugsnag-android is already initalised
            client = InternalHooks.getClient()
        } catch (er: IllegalStateException) {
            throw er
        }

        val config = InternalHooks.getConfig()

        // TODO: I think we also want to return values for state here too:
        // i.e of user, context and metadata
        return configSerializer.serialize(config)
    }

    override fun getName(): String {
        return "BugsnagReactNative"
    }

    @ReactMethod
    private fun leaveBreadcrumb(map: ReadableMap) {
        client.leaveBreadcrumb("Breadcrumb from JS: TODO")
    }

    @ReactMethod
    internal fun startSession() = client.startSession()

    @ReactMethod
    internal fun pauseSession() = client.pauseSession()

    @ReactMethod
    internal fun resumeSession() {
        client.resumeSession()
    }

    @ReactMethod
    internal fun updateContext(context: String?) {
        client.context = context
    }

    @ReactMethod
    private fun updateMetadata(section: String, data: ReadableMap) {
        client.addMetadata(section, "TODO", "metadata update from js")
    }

    @ReactMethod
    internal fun updateUser(id: String?, email: String?, name: String?) {
        client.setUser(id, email, name)
    }

    @ReactMethod
    private fun dispatch(payload: ReadableMap, promise: Promise) {
        client.notify(RuntimeException("TODO")) {
            // TODO modify payload here
            true
        }
        promise.resolve(true)
    }

    @ReactMethod
    private fun getPayloadInfo(promise: Promise) {
        val info = WritableNativeMap()
        // info.putMap("app", Arguments.makeNativeMap(NativeInterface.getAppData()));
        // info.putMap("device", Arguments.makeNativeMap(NativeInterface.getDeviceData()));
        //
        // List<Breadcrumb> breadcrumbs = NativeInterface.getBreadcrumbs();
        // List<WritableMap> values = new ArrayList<>();
        //
        // for (Breadcrumb breadcrumb : breadcrumbs) {
        //     values.add(breadcrumbSerializer.serialize(breadcrumb));
        // }
        //
        // info.putArray("breadcrumbs", Arguments.makeNativeArray(values));
        promise.resolve(info)
    }
}
