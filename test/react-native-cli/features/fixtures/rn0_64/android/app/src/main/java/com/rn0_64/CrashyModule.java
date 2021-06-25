package com.rn0_64;

import com.bugsnag.android.Bugsnag;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class CrashyModule extends ReactContextBaseJavaModule {
    public CrashyModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "CrashyCrashy";
    }

    @ReactMethod
    public void generateCrash() throws Exception {
        throw new Exception("Ooopsy from Java!");
    }

    @ReactMethod
    public void generatePromiseRejection(Promise promise) {
        promise.reject(new Exception("Oops - rejected promise from Java!"));
    }

    @ReactMethod
    public void handledError() throws Exception {
        Bugsnag.notify(new Exception("Handled ooopsy from Java!"));
    }
}
