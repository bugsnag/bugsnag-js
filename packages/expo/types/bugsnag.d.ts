import * as BugsnagCore from "@bugsnag/core";

// overwrite config interface, adding node-specific options
declare module "@bugsnag/core" {
  interface Config {
    apiKey?: string;
    onError?: BugsnagCore.OnError | BugsnagCore.OnError[];
    enabledBreadcrumbTypes?: BugsnagCore.BreadcrumbType[];
    autoDetectErrors?: boolean;
    autoDetectUnhandledRejections?: boolean;
    appVersion?: string;
    appType?: string;
    endpoints?: { notify: string; sessions?: string };
    autoTrackSessions?: boolean;
    enabledReleaseStages?: string[];
    releaseStage?: string;
    maxBreadcrumbs?: number;
    user?: object | null;
    metaData?: object | null;
    logger?: BugsnagCore.Logger | null;
    filters?: Array<string | RegExp>;
    // catch-all for any missing options
    [key: string]: any;
  }
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts?: string | BugsnagCore.Config): BugsnagCore.Client;

// commonjs/requirejs export
export default bugsnag;
export { BugsnagCore as Bugsnag };
