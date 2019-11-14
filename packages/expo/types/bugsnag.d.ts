import * as BugsnagCore from "@bugsnag/core";

// overwrite config interface, adding node-specific options
declare module "@bugsnag/core" {
  interface Config {
    apiKey?: string;
    beforeSend?: BugsnagCore.BeforeSend | BugsnagCore.BeforeSend[];
    autoBreadcrumbs?: boolean;
    autoNotify?: boolean;
    appVersion?: string;
    appType?: string;
    endpoints?: { notify: string; sessions?: string };
    autoCaptureSessions?: boolean;
    notifyReleaseStages?: string[];
    releaseStage?: string;
    maxBreadcrumbs?: number;
    user?: object | null;
    metaData?: object | null;
    logger?: BugsnagCore.Logger | null;
    filters?: Array<string | RegExp>;
    // catch-all for any missing options
    [key: string]: any;
    // options for all bundled expo plugins
    appStateBreadcrumbsEnabled?: boolean;
    consoleBreadcrumbsEnabled?: boolean;
    networkBreadcrumbsEnabled?: boolean;
    navigationBreadcrumbsEnabled?: boolean;
    connectivityBreadcrumbsEnabled?: boolean;
    orientationBreadcrumbsEnabled?: boolean;
  }
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts?: string | BugsnagCore.Config): BugsnagCore.Client;

// commonjs/requirejs export
export default bugsnag;
export { BugsnagCore as Bugsnag };
