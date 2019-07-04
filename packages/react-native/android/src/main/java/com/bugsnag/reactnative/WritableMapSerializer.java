package com.bugsnag.reactnative;

import com.facebook.react.bridge.WritableMap;

interface WritableMapSerializer<T> {
    WritableMap serialize(T obj);
}
