import Bugsnag from "@bugsnag/js";
import BugsnagPluginReact from "@bugsnag/plugin-react";

export function register() {
    Bugsnag.start({
        apiKey: "YOUR_API_KEY",
        appVersion: "0.0.1",
    });
}