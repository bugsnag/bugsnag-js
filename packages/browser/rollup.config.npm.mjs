import createRollupConfig from "../../.rollup/index.mjs";

export default createRollupConfig({
  input: "src/notifier.ts",
  external: [
    "@bugsnag/core/client",
    "@bugsnag/core/event",
    "@bugsnag/core/session",
    "@bugsnag/core/breadcrumb",
    "@bugsnag/core/config",
    "@bugsnag/core/types",
    "@bugsnag/core/lib/es-utils/map",
    "@bugsnag/core/lib/es-utils/keys",
    "@bugsnag/core/lib/es-utils/assign",
    "@bugsnag/plugin-window-onerror",
    "@bugsnag/plugin-window-unhandled-rejection",
    "@bugsnag/plugin-app-duration",
    "@bugsnag/plugin-browser-device",
    "@bugsnag/plugin-browser-context",
    "@bugsnag/plugin-browser-request",
    "@bugsnag/plugin-simple-throttle",
    "@bugsnag/plugin-console-breadcrumbs",
    "@bugsnag/plugin-network-breadcrumbs",
    "@bugsnag/plugin-navigation-breadcrumbs",
    "@bugsnag/plugin-interaction-breadcrumbs",
    "@bugsnag/plugin-inline-script-content",
    "@bugsnag/plugin-browser-session",
    "@bugsnag/plugin-client-ip",
    "@bugsnag/plugin-strip-query-string",
    "@bugsnag/delivery-x-domain-request",
    "@bugsnag/delivery-xml-http-request"
  ],
});
