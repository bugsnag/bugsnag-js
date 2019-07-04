package com.bugsnag.android; // FIXME move to reactnative package once breadcrumb constructor updated

import com.bugsnag.reactnative.ReadableMapDeserializer;

import java.util.Collections;
import java.util.Locale;
import java.util.Map;

public class BreadcrumbDeserializer implements ReadableMapDeserializer<Breadcrumb> {

    @Override
    public Breadcrumb deserialize(Map<String, Object> map) {
        try {
            String name = null;
            BreadcrumbType crumbType = null;
            Map<String, String> metadata = Collections.emptyMap();

            for (Map.Entry<String, Object> entry : map.entrySet()) {
                switch (entry.getKey()) {
                    case "name":
                        name = (String) entry.getValue();
                        break;
                    case "type":
                        String type = (String) entry.getValue();
                        crumbType = BreadcrumbType.valueOf(type.toUpperCase(Locale.US));
                        break;
                    case "metaData":
                        metadata = (Map<String, String>) entry.getValue();
                        break;
                    default:
                        break;
                }
            }
            if (name == null || crumbType == null) {
                return null;
            }
            return new Breadcrumb(name, crumbType, metadata);
        } catch (Exception exc) {
            return null;
        }
    }

}
