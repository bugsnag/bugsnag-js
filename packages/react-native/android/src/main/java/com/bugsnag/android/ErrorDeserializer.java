package com.bugsnag.android;

import com.bugsnag.reactnative.ReadableMapDeserializer;

import java.util.Locale;
import java.util.Map;

public class ErrorDeserializer implements ReadableMapDeserializer<Error> {

    @Override
    public Error deserialize(Map<String, Object> map) {
        // TODO extract this out of Error class in bugsnag-android
        Client client = Bugsnag.getClient();

        Object handledState = map.get("unhandled");
        boolean unhandled = handledState instanceof Boolean && (boolean) handledState;
        Configuration config = client.getConfig();
        Error error = InternalHooks.generateError(config, client.sessionTracker, unhandled);

        try {
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                Object obj = entry.getValue();

                switch (entry.getKey()) {
                    case "severity":
                        configureSeverity(error, (String) obj);
                        break;
                    case "context":
                        error.setContext((String) obj);
                        break;
                    case "groupingHash":
                        error.setGroupingHash((String) obj);
                        break;
                    case "app":
                        configureAppData(error, entry);
                        break;
                    case "device":
                        configureDeviceData(error, entry);
                        break;
                    case "metaData":
                        configureMetaData(error, entry);
                        break;
                        // TODO set the below
                    case "breadcrumbs":
                    case "user":
                    case "exceptions":
                    default:
                        break;
                }
            }
            return error;
        } catch (Exception exc) {
            return null;
        }
    }

    private void configureSeverity(Error error, String obj) {
        String severity = obj.toUpperCase(Locale.US);
        error.setSeverity(Severity.valueOf(severity));
    }

    private void configureAppData(Error error, Map.Entry<String, Object> entry) {
        Map<String, Object> appData = (Map<String, Object>) entry.getValue();
        error.setAppData(appData);
    }

    private void configureDeviceData(Error error, Map.Entry<String, Object> entry) {
        Map<String, Object> deviceData = (Map<String, Object>) entry.getValue();
        error.setDeviceData(deviceData);
    }

    private void configureMetaData(Error error, Map.Entry<String, Object> entry) {
        Map<String, Object> metadata = (Map<String, Object>) entry.getValue();
        error.setMetaData(new MetaData(metadata));
    }

}
