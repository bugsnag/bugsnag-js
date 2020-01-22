package com.bugsnag.reactnative;

import com.bugsnag.android.Bugsnag;
import com.bugsnag.android.Event;
import com.bugsnag.android.ImmutableConfig;
import com.bugsnag.android.InternalHooks;
import com.bugsnag.android.OnErrorCallback;

import android.content.Context;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import javax.annotation.Nonnull;

public class BugsnagReactNative extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private final ConfigSerializer configSerializer = new ConfigSerializer();

    public BugsnagReactNative(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    private WritableMap configure() {
        try {
            // see if bugsnag-android is already initalised
            InternalHooks.getClient();
        } catch (IllegalStateException er) {
            throw er;
        }

        ImmutableConfig config = InternalHooks.getConfig();

        // TODO: I think we also want to return values for state here too:
        // i.e of user, context and metadata
        return configSerializer.serialize(config);
    }

    @Override
    public String getName() {
        return "BugsnagReactNative";
    }

    @ReactMethod
    private void leaveBreadcrumb(ReadableMap map) {
        Bugsnag.getClient().leaveBreadcrumb("Breadcrumb from JS: TODO");
    }

    @ReactMethod
    private void startSession() {
        Bugsnag.getClient().startSession();
    }

    @ReactMethod
    private void pauseSession() {
        Bugsnag.getClient().pauseSession();
    }

    @ReactMethod
    private void resumeSession() {
        Bugsnag.getClient().resumeSession();
    }

    @ReactMethod
    private void updateContext(String context) {
        Bugsnag.getClient().setContext(context);
    }

    @ReactMethod
    private void updateMetadata(String section, ReadableMap data) {
        Bugsnag.getClient().addMetadata(section, "TODO", "metadata update from js");
    }

    @ReactMethod
    private void updateUser(String id, String email, String name) {
        Bugsnag.getClient().setUser(id, email, name);
    }

    @ReactMethod
    private void dispatch(ReadableMap payload, Promise promise) {
        Bugsnag.getClient().notify(new RuntimeException("TODO"), new OnErrorCallback() {
            @Override
            public boolean onError(@Nonnull Event event) {
                // TODO modify payload here
                return true;
            }
        });
        promise.resolve(true);
    }

    @ReactMethod
    private void getPayloadInfo(Promise promise) {
        WritableMap info = new WritableNativeMap();
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
        promise.resolve(info);
    }
}
