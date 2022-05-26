package com.bugsnag.android;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

class ReactNativeCompat {
  private ReactNativeCompat() {
  }

  @SuppressWarnings("unchecked")
  static WritableMap toWritableMap(Map<String, ? extends Object> javaMap) {
    WritableMap writableMap = Arguments.createMap();

    if (javaMap == null) {
      return writableMap;
    }

    for (Map.Entry<String, ? extends Object> entry : javaMap.entrySet()) {
      String key = entry.getKey();
      Object value = entry.getValue();

      if (value instanceof String) {
        writableMap.putString(key, (String) value);
      } else if (value instanceof Integer) {
        writableMap.putInt(key, (Integer) value);
      } else if (value instanceof Number) {
        writableMap.putDouble(key, ((Number) value).doubleValue());
      } else if (value instanceof Boolean) {
        writableMap.putBoolean(key, (Boolean) value);
      } else if (value instanceof Map) {
        writableMap.putMap(key, toWritableMap((Map<String, ? extends Object>) value));
      } else if (value instanceof Collection) {
        writableMap.putArray(key, toWritableArray((Collection) value));
      } else if (value == null) {
        writableMap.putNull(key);
      }
    }

    return writableMap;
  }

  static WritableArray toWritableArray(Collection<? extends Object> collection) {
    WritableArray writableArray = Arguments.createArray();

    if (collection == null) {
      return writableArray;
    }

    for (Object value : collection) {
      if (value instanceof String) {
        writableArray.pushString((String) value);
      } else if (value instanceof Integer) {
        writableArray.pushInt((Integer) value);
      } else if (value instanceof Number) {
        writableArray.pushDouble(((Number) value).doubleValue());
      } else if (value instanceof Boolean) {
        writableArray.pushBoolean((Boolean) value);
      } else if (value instanceof Map) {
        writableArray.pushMap(toWritableMap((Map<String, ? extends Object>) value));
      } else if (value instanceof Collection) {
        writableArray.pushArray(toWritableArray((Collection) value));
      } else if (value == null) {
        writableArray.pushNull();
      }
    }

    return writableArray;
  }
}
