package com.bugsnag.reactnative;

import com.bugsnag.android.ImmutableConfig;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

public class ConfigSerializer implements WritableMapSerializer<ImmutableConfig> {

    @Override
    public WritableMap serialize(ImmutableConfig config) {
        WritableMap map = new WritableNativeMap();

        WritableMap endpoints = new WritableNativeMap();
        endpoints.putString("notify", config.getEndpoints().getNotify());
        endpoints.putString("sessions", config.getEndpoints().getSessions());
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

        map.putString("buildUuid", config.getBuildUuid());
        // map.putBoolean("sendThreads", config.getSendThreads());
        map.putBoolean("autoTrackSessions", config.getAutoTrackSessions());
        // map.putBoolean("detectAnrs", config.getDetectAnrs());
        // map.putBoolean("detectNdkCrashes", config.getDetectNdkCrashes());

        return map;
    }
}
