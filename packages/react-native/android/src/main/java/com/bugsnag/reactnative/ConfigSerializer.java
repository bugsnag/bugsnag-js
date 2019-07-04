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
        map.putString("appVersion", config.getAppVersion());
        map.putString("buildUuid", config.getBuildUUID());
        map.putString("releaseStage", config.getReleaseStage());
        map.putBoolean("sendThreads", config.getSendThreads());
        map.putBoolean("autoCaptureSessions", config.getAutoCaptureSessions());
        map.putBoolean("detectAnrs", config.getDetectAnrs());
        map.putBoolean("detectNdkCrashes", config.getDetectNdkCrashes());
        return map;
    }
}
