package com.bugsnag.reactnative;

import com.facebook.react.bridge.ReadableMap;

interface ReadableMapDeserializer<T> {
    T deserialize(ReadableMap map);
}
