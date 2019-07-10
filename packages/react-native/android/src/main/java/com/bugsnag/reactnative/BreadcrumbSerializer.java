package com.bugsnag.reactnative;

import com.bugsnag.android.Breadcrumb;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import java.util.Map;

public class BreadcrumbSerializer implements WritableMapSerializer<Breadcrumb> {

    @Override
    public WritableMap serialize(Breadcrumb obj) {
        WritableMap map = new WritableNativeMap();
        map.putString("timestamp", obj.getTimestamp());
        map.putString("name", obj.getName());
        map.putString("type", obj.getType().toString());
        map.putMap("metaData", Arguments.makeNativeMap((Map) obj.getMetadata()));
        return map;
    }
}
