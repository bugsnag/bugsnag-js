package com.bugsnag.reactnative;

import com.bugsnag.android.Breadcrumb;
import com.bugsnag.android.BreadcrumbDeserializer;
import com.bugsnag.android.Bugsnag;
import com.bugsnag.android.BugsnagException;
import com.bugsnag.android.Callback;
import com.bugsnag.android.Client;
import com.bugsnag.android.Configuration;
import com.bugsnag.android.InternalHooks;
import com.bugsnag.android.Report;

import android.content.Context;
import android.support.annotation.NonNull;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nonnull;

public class BugsnagReactNative extends ReactContextBaseJavaModule {

    // TODO populate this (read directly from JS)
    public static ReadableMap versions;

    static String bugsnagJsVersion; // TODO need to set this value
    static String bugsnagAndroidVersion;

    private final BreadcrumbDeserializer breadcrumbDeserializer = new BreadcrumbDeserializer();

    public BugsnagReactNative(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);
    }

    /**
     * Instantiates a bugsnag client using the API key in the AndroidManifest.xml
     *
     * @param context the application context
     * @return the bugsnag client
     */
    public static Client start(Context context) {
        Client client = Bugsnag.init(context);
        configureClient(client);
        return client;
    }

    /**
     * Instantiates a bugsnag client with a given API key.
     *
     * @param context the application context
     * @param apiKey  the api key for your project
     * @return the bugsnag client
     */
    public static Client startWithApiKey(Context context, String apiKey) {
        Client client = Bugsnag.init(context, apiKey);
        configureClient(client);
        return client;
    }

    /**
     * Instantiates a bugsnag client with a given configuration object.
     *
     * @param context the application context
     * @param config  configuration for how bugsnag should behave
     * @return the bugsnag client
     */
    public static Client startWithConfiguration(Context context, Configuration config) {
        Client client = Bugsnag.init(context, config);
        configureClient(client);
        return client;
    }

    private static void configureClient(Client client) {
        InternalHooks.configureClient(client);

        // TODO set these as config up front if possible
        client.setIgnoreClasses("com.facebook.react.common.JavascriptException");
        bugsnagAndroidVersion = client.getClass().getPackage().getSpecificationVersion();
        // TODO set codeBundleId here
        Log.d("BugsnagReactNative", "Initialised bugsnag-react-native");
    }

    @Override
    public String getName() {
        return "BugsnagReactNative";
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public WritableMap getConfig() {
        Configuration config = Bugsnag.getClient().getConfig();
        // TODO serialise as a readablemap
        return null;
    }

    /**
     * Updates the native metadata using metadata from the JS layer
     */
    @ReactMethod
    public void updateMetaData(ReadableMap update) {
        // TODO update metadata
    }

    /**
     * Updates the native context using the context from the JS layer
     */
    @ReactMethod
    public void updateContext(String context) {
        Bugsnag.getClient().setContext(context);
    }

    /**
     * Updates the native user using the user from the JS layer
     */
    @ReactMethod
    void updateUser(String id, String name, String email) {
        Bugsnag.getClient().setUser(id, name, email);
    }

    /**
     * Deliver the report using the native delivery mechanism
     */
    @ReactMethod
    public void dispatch(ReadableMap payload, Promise promise) {
        // TODO deserialize stacktrace etc here
        BugsnagException exc = new BugsnagException("", "", new StackTraceElement[]{});

        Bugsnag.getClient().notify(exc, new Callback() {
            @Override
            public void beforeNotify(@NonNull Report report) {
                // TODO modify payload here
            }
        });
        promise.resolve(true);
    }

    /**
     * Retrieves breadcrumbs, app info, and device info from the native layer.
     */
    @ReactMethod
    public void getPayloadInfo(Promise promise) {
        Client client = Bugsnag.getClient();
        Map<String, Object> info = new HashMap<>();
        info.put("app", client.getAppData());
        info.put("device", client.getDeviceData());
        info.put("breadcrumbs", client.getBreadcrumbs());
        promise.resolve(info);
    }

    /**
     * Adds a breadcrumb from the JS layer to the native layer.
     */
    @ReactMethod
    public void leaveBreadcrumb(ReadableMap map) {
        Breadcrumb breadcrumb = breadcrumbDeserializer.deserialize(map.toHashMap());

        if (breadcrumb != null) {
            Bugsnag.getClient().leaveBreadcrumb(breadcrumb.getName(),
                    breadcrumb.getType(), breadcrumb.getMetadata());
        } else {
            InternalHooks.logWarning("Failed to leave breadcrumb");
        }
    }

    /**
     * Start a new session in the native layer.
     */
    @ReactMethod
    public void startSession() {
        Bugsnag.getClient().startSession();
    }

    /**
     * Stop the current session in the native layer, if one has been started.
     */
    @ReactMethod
    public void stopSession() {
        Bugsnag.getClient().stopSession();
    }

    /**
     * Resume the previously started session or start a new one if none available.
     */
    @ReactMethod
    public void resumeSession(Promise promise) {
        promise.resolve(Bugsnag.getClient().resumeSession());
    }

}
