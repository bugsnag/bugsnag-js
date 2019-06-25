package com.bugsnag.android;

public class InternalHooks {

    /**
     * Configures the bugsnag client by hooking into package-visible APIs within bugsnag-android
     */
    public static void configureClient(Client client) {
        client.getConfig().addBeforeSendSession(new BeforeSendSession() {
            @Override
            public void beforeSendSession(SessionTrackingPayload payload) {
                RuntimeVersions.addRuntimeVersions(payload.getDevice());
            }
        });

        client.getConfig().beforeSend(new BeforeSend() {
            @Override
            public boolean run(Report report) {
                RuntimeVersions.addRuntimeVersions(report.getError().getDeviceData());
                return true;
            }
        });
    }

    /**
     * Logs a warning using bugsnag-android's logger, as this already handles whether the user
     * has disabled logging or not.
     */
    public static void logWarning(String msg) {
        Logger.warn(msg);
    }

}
