package com.bugsnag.android;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import androidx.test.InstrumentationRegistry;

import org.junit.Before;
import org.junit.Test;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class ErrorDeserializerTest {

    private final ErrorDeserializer errorDeserializer = new ErrorDeserializer();

    @Before
    public void setUp() throws Exception {
        Bugsnag.init(InstrumentationRegistry.getContext(), "api-key");
    }

    @Test
    public void emptyMapReturns() {
        assertNotNull(errorDeserializer.deserialize(new HashMap<String, Object>()));
    }

    @Test
    public void unhandledSerialized() {
        Map<String, Object> map = new HashMap<>();
        map.put("unhandled", true);
        Error error = errorDeserializer.deserialize(map);
        assertNotNull(error);
        assertTrue(error.getHandledState().isUnhandled());
    }

    @Test
    public void severitySerialized() {
        Map<String, Object> map = new HashMap<>();
        map.put("severity", "info");
        Error error = errorDeserializer.deserialize(map);
        assertNotNull(error);
        assertEquals(Severity.INFO, error.getSeverity());
    }

    @Test
    public void contextSerialized() {
        Map<String, Object> map = new HashMap<>();
        map.put("context", "flavourOfTheMonth.js");
        Error error = errorDeserializer.deserialize(map);
        assertNotNull(error);
        assertEquals("flavourOfTheMonth.js", error.getContext());
    }

    @Test
    public void groupingHashSerialized() {
        Map<String, Object> map = new HashMap<>();
        map.put("groupingHash", "fa740b45");
        Error error = errorDeserializer.deserialize(map);
        assertNotNull(error);
        assertEquals("fa740b45", error.getGroupingHash());
    }

    @Test
    public void appTabSerialized() {
        Map<String, Object> map = new HashMap<>();
        Map<String, Object> appData = new HashMap<>();
        map.put("app", appData);
        appData.put("foo", true);
        appData.put("nested", Collections.singletonMap("bar", "hello"));

        Error error = errorDeserializer.deserialize(map);
        assertNotNull(error);
        Map<String, Object> results = error.getAppData();
        assertTrue((Boolean) results.get("foo"));
        assertEquals("hello", ((Map)results.get("nested")).get("bar"));
    }

    @Test
    public void deviceTabSerialized() {
        Map<String, Object> map = new HashMap<>();
        Map<String, Object> deviceData = new HashMap<>();
        map.put("device", deviceData);
        deviceData.put("foo", true);
        deviceData.put("nested", Collections.singletonMap("bar", "hello"));

        Error error = errorDeserializer.deserialize(map);
        assertNotNull(error);
        Map<String, Object> results = error.getDeviceData();
        assertTrue((Boolean) results.get("foo"));
        assertEquals("hello", ((Map)results.get("nested")).get("bar"));
    }

    @Test
    public void metadataSerialized() {
        Map<String, Object> map = new HashMap<>();
        Map<String, Object> metaData = new HashMap<>();
        map.put("metaData", metaData);
        metaData.put("foo", true);
        metaData.put("nested", Collections.singletonMap("bar", "hello"));

        Error error = errorDeserializer.deserialize(map);
        assertNotNull(error);
        Map<String, Object> results = error.getMetaData().store;
        assertTrue((Boolean) results.get("foo"));
        assertEquals("hello", ((Map)results.get("nested")).get("bar"));
    }

}
