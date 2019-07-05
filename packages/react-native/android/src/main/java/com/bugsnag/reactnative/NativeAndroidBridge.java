package com.bugsnag.reactnative;

import com.bugsnag.android.NativeInterface;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import java.util.Observable;
import java.util.Observer;

class NativeAndroidBridge implements Observer {

    interface NativeEventListener {
        void onNativeEvent(WritableMap nativeEvent);
    }

    private final NativeEventListener nativeEventListener;

    NativeAndroidBridge(NativeEventListener nativeEventListener) {
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
                event.putString("type", "context");
                event.putString("value", (String) msg.value);
                break;
            default:
                return null;
        }
        return event;
    }
}
