package com.bugsnag.reactnative;

import java.util.Map;

public interface ReadableMapDeserializer<T> {
    T deserialize(Map<String, Object> map);
}
