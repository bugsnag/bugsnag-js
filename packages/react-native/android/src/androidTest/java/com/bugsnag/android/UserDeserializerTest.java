package com.bugsnag.android;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import org.junit.Test;

import java.util.HashMap;
import java.util.Map;

public class UserDeserializerTest {

    private final UserDeserializer userDeserializer = new UserDeserializer();

    @Test
    public void emptyMapReturns() {
        assertNotNull(userDeserializer.deserialize(new HashMap<String, Object>()));
    }

    @Test
    public void userSerializes() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", "123");
        map.put("name", "Joey McCloggin");
        map.put("email", "joey@aol.com");

        User user = userDeserializer.deserialize(map);
        assertNotNull(user);
        assertEquals("123", user.getId());
        assertEquals("Joey McCloggin", user.getName());
        assertEquals("joey@aol.com", user.getEmail());
    }
}