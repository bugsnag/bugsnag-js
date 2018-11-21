import * as BugsnagCore from "@bugsnag/core";

// overwrite config interface, adding browser-specific options
declare module "@bugsnag/core" {
  interface IConfig {
    apiKey: string;
    beforeSend?: BugsnagCore.BeforeSend | BugsnagCore.BeforeSend[];
    autoBreadcrumbs?: boolean;
    autoNotify?: boolean;
    appVersion?: string;
    appType?: string;
    endpoints?: { notify: string, sessions?: string };
    autoCaptureSessions?: boolean;
    notifyReleaseStages?: string[];
    releaseStage?: string;
    maxBreadcrumbs?: number;
    user?: object | null;
    metaData?: object | null;
    logger?: BugsnagCore.ILogger | null;
    filters?: Array<string | RegExp>;
    // catch-all for any missing options
    [key: string]: any;
    // deprecated options which are still supported
    endpoint?: string;
    sessionEndpoint?: string;
    // options for all bundled browser plugins
    maxEvents?: number;
    consoleBreadcrumbsEnabled?: boolean;
    networkBreadcrumbsEnabled?: boolean;
    navigationBreadcrumbsEnabled?: boolean;
    interactionBreadcrumbsEnabled?: boolean;
    collectUserIp?: boolean;
  }
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts: string | BugsnagCore.IConfig): BugsnagCore.Client;

// commonjs/requirejs export
export default bugsnag;
export { BugsnagCore as Bugsnag };
