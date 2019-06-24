package com.bugsnag.reactnative;

import com.bugsnag.android.Bugsnag;
import com.bugsnag.android.Client;
import com.bugsnag.android.Configuration;

import android.content.Context;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import java.util.logging.Logger;

public class BugsnagReactNative extends ReactContextBaseJavaModule {

    private ReactContext reactContext;
    private String libraryVersion;
    private String bugsnagAndroidVersion;
    static final Logger logger = Logger.getLogger("bugsnag-react-native");

    public static ReactPackage getPackage() {
        return new BugsnagPackage();
    }

    public BugsnagReactNative(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    // @Override
    // public Map<String, Object> getConstants() {
    //   HashMap<String, Object> constants = new HashMap<>();
    //   Client client = getClient();
    //   if (client != null) {
    //     Configuration config = client.getConfig();
    //     String key = config.getApiKey();
    //     constants.put("apiKey", key);
    //   }
    //   // TODO: if bugsnag has not been started, it would be nice to read the manifest
    //   // and get the default api key. This is how it works on iOS.
    //   return constants;
    // }
    //
    // // @Override
    // public boolean hasConstants() {
    //   return true;
    // }
    //
    @Override
    public String getName() {
        return "BugsnagReactNative";
    }

    /** Start a new session. */
    @ReactMethod
    public void startSession() {
        Bugsnag.startSession();
    }

    /** Stop the current session. */
    @ReactMethod
    public void stopSession() {
        Bugsnag.stopSession();
    }

    /** Resume the previously started session or start a new one if none available. */
    @ReactMethod
    public void resumeSession() {
        Bugsnag.resumeSession();
    }

    /** Leaves a breadcrumb. */
    @ReactMethod
    public void leaveBreadcrumb(ReadableMap options) {
      // Bugsnag.leaveBreadcrumb(
      //     options.getString("name"),
      //     parseBreadcrumbType(options.getString("type")),
      //     readStringMap(options.getMap("metadata")));
    }

    /** Deliver the report. */
    @ReactMethod
    public void deliver(ReadableMap payload, Promise promise) {
        // TODO: deliver payload immediately, caching upon failure
        promise.resolve(null);
    }

    /** Breadcrumbs, app info, and device info available in the native layer. */
    @ReactMethod
    public void nativePayloadInfo(Promise promise) {
        promise.resolve("");
    }

    /** Update configuration based on props set on the JavaScript layer client. */
    @ReactMethod
    public void updateClientProperty(ReadableMap options) {}

}
