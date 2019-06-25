package com.bugsnag.reactnative;

import com.bugsnag.android.Callback;
import com.bugsnag.android.MetaData;
import com.bugsnag.android.Report;
import com.bugsnag.android.Severity;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

import java.util.HashMap;
import java.util.Map;

/**
 * Attaches report diagnostics before delivery
 */
@Deprecated // copied from previous implementation for reference
class DiagnosticsCallback implements Callback {

    static final String NOTIFIER_NAME = "Bugsnag for React Native";
    static final String NOTIFIER_URL = "https://github.com/bugsnag/bugsnag-react-native";

    private final Severity severity;
    private final String context;
    private final String groupingHash;
    private final Map<String, Object> metadata;
    private final String libraryVersion;
    private final String bugsnagAndroidVersion;

    DiagnosticsCallback(String libraryVersion,
                        String bugsnagAndroidVersion,
                        ReadableMap payload) {
        this.libraryVersion = libraryVersion;
        this.bugsnagAndroidVersion = bugsnagAndroidVersion;
        severity = parseSeverity(payload.getString("severity"));
        metadata = readObjectMap(payload.getMap("metadata"));

        if (payload.hasKey("context")) {
            context = payload.getString("context");
        } else {
            context = null;
        }

        if (payload.hasKey("groupingHash")) {
            groupingHash = payload.getString("groupingHash");
        } else {
            groupingHash = null;
        }
    }

    Severity parseSeverity(String value) {
        switch (value) {
            case "error":
                return Severity.ERROR;
            case "info":
                return Severity.INFO;
            case "warning":
            default:
                return Severity.WARNING;
        }
    }

    /**
     * Convert a typed map from JS into a Map
     */
    Map<String, Object> readObjectMap(ReadableMap map) {
        Map<String, Object> output = new HashMap<>();
        ReadableMapKeySetIterator iterator = map.keySetIterator();

        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            ReadableMap pair = map.getMap(key);
            switch (pair.getString("type")) {
                case "boolean":
                    output.put(key, pair.getBoolean("value"));
                    break;
                case "number":
                    output.put(key, pair.getDouble("value"));
                    break;
                case "string":
                    output.put(key, pair.getString("value"));
                    break;
                case "map":
                    output.put(key, readObjectMap(pair.getMap("value")));
                    break;
                default:
                    break;
            }
        }
        return output;
    }

    @Override
    public void beforeNotify(Report report) {
        report.getNotifier().setName(NOTIFIER_NAME);
        report.getNotifier().setURL(NOTIFIER_URL);
        report.getNotifier().setVersion(String.format("%s (Android %s)",
                libraryVersion,
                bugsnagAndroidVersion));

        if (groupingHash != null && groupingHash.length() > 0) {
            report.getError().setGroupingHash(groupingHash);
        }
        if (context != null && context.length() > 0) {
            report.getError().setContext(context);
        }
        if (metadata != null) {
            MetaData reportMetadata = report.getError().getMetaData();
            for (String tab : metadata.keySet()) {
                Object value = metadata.get(tab);

                if (value instanceof Map) {
                    @SuppressWarnings("unchecked") // ignore type erasure when casting Map
                            Map<String, Object> values = (Map<String, Object>) value;

                    for (String key : values.keySet()) {
                        reportMetadata.addToTab(tab, key, values.get(key));
                    }
                }
            }
        }
    }
}
