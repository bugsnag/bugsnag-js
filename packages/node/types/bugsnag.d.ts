import * as BugsnagCore from "@bugsnag/core";

type afterErrorCb = (err: any, event: BugsnagCore.Event, logger: BugsnagCore.Logger) => void;

// overwrite config interface, adding node-specific options
declare module "@bugsnag/core" {
  interface Config {
    apiKey: string;
    beforeSend?: BugsnagCore.BeforeSend | BugsnagCore.BeforeSend[];
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
    // options for node-specific built-ins
    hostname?: string;
    onUncaughtException?: afterErrorCb;
    onUnhandledRejection?: afterErrorCb;
    agent?: any;
    projectRoot?: string;
    sendCode?: boolean;
    // breadcrumbs are disabled in Node
    enabledBreadcrumbTypes?: void;
  }
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts: string | BugsnagCore.Config): BugsnagCore.Client;

// commonjs/requirejs export
export default bugsnag;
export { BugsnagCore as Bugsnag }
