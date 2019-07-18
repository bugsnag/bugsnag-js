package com.bugsnag.reactnative;

import com.bugsnag.android.Configuration;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

public class ConfigSerializer implements WritableMapSerializer<Configuration> {

    @Override
    public WritableMap serialize(Configuration config) {
        WritableMap map = new WritableNativeMap();
        WritableMap endpoints = new WritableNativeMap();
        endpoints.putString("notify", config.getEndpoint());
        endpoints.putString("sessions", config.getSessionEndpoint());
        map.putMap("endpoints", endpoints);
        map.putString("apiKey", config.getApiKey());
        String appVersion = config.getAppVersion();
        if (appVersion != null) {
            map.putString("appVersion", appVersion);
        }
        String releaseStage = config.getReleaseStage();
        if (releaseStage != null) {
            map.putString("releaseStage", releaseStage);
        }
        map.putString("buildUuid", config.getBuildUUID());
        map.putBoolean("sendThreads", config.getSendThreads());
        map.putBoolean("autoCaptureSessions", config.getAutoCaptureSessions());
        map.putBoolean("detectAnrs", config.getDetectAnrs());
        map.putBoolean("detectNdkCrashes", config.getDetectNdkCrashes());
        return map;
    }
}
