package com.bugsnag.reactnative;

final class MessageEvent {

    final String type;
    final Object value;

    MessageEvent(String type, Object value) {
        this.type = type;
        this.value = value;
    }
}
