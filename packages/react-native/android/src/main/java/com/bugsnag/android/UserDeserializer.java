package com.bugsnag.android;

import com.bugsnag.reactnative.ReadableMapDeserializer;

import java.util.Map;

class UserDeserializer implements ReadableMapDeserializer<User> {

    @Override
    public User deserialize(Map<String, Object> map) {
        try {
            User user = new User();

            for (Map.Entry<String, Object> entry : map.entrySet()) {
                String obj = (String) entry.getValue();

                switch (entry.getKey()) {
                    case "id":
                        user.setId(obj);
                        break;
                    case "email":
                        user.setEmail(obj);
                        break;
                    case "name":
                        user.setName(obj);
                        break;
                    default:
                        break;
                }
            }
            return user;
        } catch (Exception exc) {
            return null;
        }
    }
}
