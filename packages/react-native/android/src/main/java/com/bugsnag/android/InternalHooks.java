package com.bugsnag.android;

public class InternalHooks {
    public static Client getClient() {
        return Bugsnag.getClient();
    }

    public static ImmutableConfig getConfig() {
        return InternalHooks.getClient().getConfig();
    }
}
