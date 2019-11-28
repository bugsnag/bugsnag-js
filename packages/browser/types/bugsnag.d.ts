import * as BugsnagCore from "@bugsnag/core";

// overwrite config interface, adding browser-specific options
declare module "@bugsnag/core" {
  interface Config {
    apiKey: string;
    onError?: BugsnagCore.OnError | BugsnagCore.OnError[];
    autoDetectErrors?: boolean;
    autoDetectUnhandledRejections?: boolean;
    enabledBreadcrumbTypes?: BugsnagCore.BreadcrumbType[] | null;
    appVersion?: string;
    appType?: string;
    endpoints?: { notify: string; sessions?: string };
    autoTrackSessions?: boolean;
    enabledReleaseStages?: string[];
    releaseStage?: string;
    maxBreadcrumbs?: number;
    user?: object | null;
    metadata?: { [key: string]: any };
    logger?: BugsnagCore.Logger | null;
    filters?: Array<string | RegExp>;
    // catch-all for any missing options
    [key: string]: any;
    // options for all bundled browser plugins
    maxEvents?: number;
    collectUserIp?: boolean;
  }
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts: string | BugsnagCore.Config): BugsnagCore.Client;

// commonjs/requirejs export
export default bugsnag;
export { BugsnagCore as Bugsnag };
