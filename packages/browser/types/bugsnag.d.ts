import { Client, Breadcrumb, Event, Session, AbstractTypes } from "@bugsnag/core";

// overwrite config interface, adding browser-specific options
declare module "@bugsnag/core" {
  interface Config {
    apiKey: string;
    appVersion?: string;
    appType?: string;
    autoDetectErrors?: boolean;
    autoDetectUnhandledRejections?: boolean;
    onError?: AbstractTypes.OnErrorCallback | AbstractTypes.OnErrorCallback[];
    endpoints?: { notify: string; sessions?: string };
    autoTrackSessions?: boolean;
    enabledReleaseStages?: string[];
    releaseStage?: string;
    maxBreadcrumbs?: number;
    enabledBreadcrumbTypes?: AbstractTypes.BreadcrumbType[];
    user?: { id?: string; name?: string; email?: string } | null;
    metadata?: object | null;
    logger?: AbstractTypes.Logger | null;
    redactedKeys?: Array<string | RegExp>;
    // catch-all for any missing options
    [key: string]: any;
    // options for all bundled browser plugins
    maxEvents?: number;
    collectUserIp?: boolean;
  }
}

declare const Bugsnag: AbstractTypes.BugsnagStatic;

export default Bugsnag;
export { Client, Breadcrumb, Event, Session, AbstractTypes };
