package com.bugsnag.android;

import android.util.Log;

public class BugsnagReactNativePlugin implements BugsnagPlugin {
    public static void register() {
        BugsnagPluginInterface.INSTANCE.registerPlugin(BugsnagReactNativePlugin.class);
    }

    private boolean loaded = false;

    @Override
    public void setLoaded(boolean loaded) {
        this.loaded = loaded;
    }

    @Override
    public boolean getLoaded() {
        return loaded;
    }

    @Override
    public void unloadPlugin() {
    }

    @Override
    public void loadPlugin(Client client) {
        Log.i("Bugsnag", "Initialized React Native plugin");
    }
}
