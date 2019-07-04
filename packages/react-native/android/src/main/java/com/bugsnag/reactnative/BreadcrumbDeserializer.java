package com.bugsnag.reactnative;

import com.bugsnag.android.Breadcrumb;

import com.facebook.react.bridge.ReadableMap;

import java.util.Map;

class BreadcrumbDeserializer implements ReadableMapDeserializer<Breadcrumb> {

    @Override
    public Breadcrumb deserialize(Map<String, Object> map) {
        // TODO deserialize the breadcrumb here
        return null;
    }
}
