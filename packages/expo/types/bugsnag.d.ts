import * as BugsnagCore from "@bugsnag/core";

// overwrite config interface, adding node-specific options
declare module "@bugsnag/core" {
  interface IConfig {
    apiKey?: string;
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
    // options for all bundled expo plugins
    consoleBreadcrumbsEnabled?: boolean;
    networkBreadcrumbsEnabled?: boolean;
    navigationBreadcrumbsEnabled?: boolean;
    connectivityBreadcrumbsEnabled?: boolean;
  }
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts?: string | BugsnagCore.IConfig): BugsnagCore.Client;

// commonjs/requirejs export
export default bugsnag;
export { BugsnagCore as Bugsnag };
