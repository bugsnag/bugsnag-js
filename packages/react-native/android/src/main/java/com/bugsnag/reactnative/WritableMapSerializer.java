package com.bugsnag.reactnative;

import java.util.Map;

interface WritableMapSerializer<T> {
    void serialize(Map<String, Object> map, T obj);
}
