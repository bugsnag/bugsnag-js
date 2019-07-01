package com.bugsnag.reactnative;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.bugsnag.android.Configuration;

import android.support.test.InstrumentationRegistry;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.soloader.SoLoader;

import org.junit.Test;

import java.io.IOException;

public class ConfigSerializerTest {

    private ConfigSerializer configSerializer = new ConfigSerializer();

    @Test
    public void testConfigSerialisation() throws IOException {
        SoLoader.init(InstrumentationRegistry.getContext(), 0);
        Configuration config = new Configuration("api-key");
        config.setBuildUUID("123");
        config.setAppVersion("2.0");
        config.setReleaseStage("prod");

        WritableMap map = configSerializer.serialize(config);
        assertNotNull(map);
        assertEquals(9, map.toHashMap().size());
        assertEquals("api-key", map.getString("apiKey"));
        assertEquals("2.0", map.getString("appVersion"));
        assertEquals("123", map.getString("buildUuid"));
        assertNotNull(map.getString("releaseStage"));
        assertTrue(map.getBoolean("sendThreads"));
        assertTrue(map.getBoolean("autoCaptureSessions"));
        assertFalse(map.getBoolean("detectAnrs"));
        assertFalse(map.getBoolean("detectNdkCrashes"));

        ReadableMap endpoints = map.getMap("endpoints");
        assertEquals("https://notify.bugsnag.com", endpoints.getString("notify"));
        assertEquals("https://sessions.bugsnag.com", endpoints.getString("sessions"));
    }
}
