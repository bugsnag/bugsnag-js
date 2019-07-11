package com.bugsnag.android;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;

import org.junit.Test;

import java.util.HashMap;
import java.util.Map;

public class BreadcrumbDeserializerTest {

    private BreadcrumbDeserializer breadcrumbDeserializer = new BreadcrumbDeserializer();

    @Test
    public void emptyMapReturnsNull() {
        assertNull(breadcrumbDeserializer.deserialize(new HashMap<String, Object>()));
    }

    @Test
    public void nullNameReturnsNull() {
        Map<String, Object> map = new HashMap<>();
        map.put("type", "error");
        assertNull(breadcrumbDeserializer.deserialize(map));
    }

    @Test
    public void nullTypeReturnsNulls() {
        Map<String, Object> map = new HashMap<>();
        map.put("name", "foo");
        assertNull(breadcrumbDeserializer.deserialize(map));
    }

    @Test
    public void testStringBreadcrumb() {
        Map<String, Object> map = new HashMap<>();
        map.put("name", "foo");
        map.put("type", "error");

        Breadcrumb breadcrumb = breadcrumbDeserializer.deserialize(map);
        assertNotNull(breadcrumb);
        assertEquals("foo", breadcrumb.getName());
        assertEquals(BreadcrumbType.ERROR, breadcrumb.getType());
    }

    @Test
    public void testMetadataBreadcrumb() {
        Map<String, Object> map = new HashMap<>();
        map.put("name", "foo");
        map.put("type", "manual");

        HashMap<String, String> metadata = new HashMap<>();
        metadata.put("custom", "data");
        map.put("metaData", metadata);

        Breadcrumb breadcrumb = breadcrumbDeserializer.deserialize(map);
        assertNotNull(breadcrumb);
        assertEquals("foo", breadcrumb.getName());
        assertEquals(BreadcrumbType.MANUAL, breadcrumb.getType());
        assertEquals("data", breadcrumb.getMetadata().get("custom"));
    }
}