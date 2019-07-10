package com.bugsnag.android;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import java.util.Map;
import java.util.Observable;
import java.util.Observer;

public class NativeAndroidBridge implements Observer {

    private static final String KEY_TYPE = "type";
    private static final String KEY_VALUE = "value";

    public interface NativeEventListener {
        void onNativeEvent(WritableMap nativeEvent);
    }

    private final NativeEventListener nativeEventListener;

    public NativeAndroidBridge(NativeEventListener nativeEventListener) {
        this.nativeEventListener = nativeEventListener;
    }

    @Override
    public void update(Observable observable, Object arg) {
        if (arg instanceof NativeInterface.Message) {
            WritableMap event = convertToEvent((NativeInterface.Message) arg);

            if (event != null) {
                nativeEventListener.onNativeEvent(event);
            }
        }
    }

    private WritableMap convertToEvent(NativeInterface.Message msg) {
        WritableMap event = Arguments.createMap();

        switch (msg.type) {
            case UPDATE_CONTEXT:
                handleContextUpdate(msg, event);
                break;
            case UPDATE_USER_NAME: // fallthrough
            case UPDATE_USER_EMAIL: // fallthrough
            case UPDATE_USER_ID:
                handleUserUpdate(event);
                break;
            case ADD_METADATA: // fallthrough
            case CLEAR_METADATA_TAB: // fallthrough
            case REMOVE_METADATA: // fallthrough
            case UPDATE_METADATA: // fallthrough
                handleMetaDataUpdate(event);
                break;
            default:
                return null;
        }
        return event;
    }

    private void handleContextUpdate(NativeInterface.Message msg, WritableMap event) {
        event.putString(KEY_TYPE, "context");
        event.putString(KEY_VALUE, (String) msg.value);
    }

    private void handleUserUpdate(WritableMap event) {
        User user = Bugsnag.getClient().getUser();
        event.putString(KEY_TYPE, "user");

        WritableMap map = Arguments.createMap();
        map.putString("id", user.getId());
        map.putString("email", user.getEmail());
        map.putString("name", user.getName());
        event.putMap(KEY_VALUE, map);
    }

    private void handleMetaDataUpdate(WritableMap event) {
        MetaData metaData = Bugsnag.getClient().getMetaData();
        Map<String, Object> map = metaData.store;
        event.putString(KEY_TYPE, "metadata");
        event.putMap(KEY_VALUE, Arguments.makeNativeMap(map));
    }
}
