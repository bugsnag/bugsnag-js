import * as Bugsnag from "@bugsnag/core";

// augment config interface
declare module "@bugsnag/core" {
  namespace Bugnsag {
    interface IConfig {
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
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts: string | Bugsnag.IConfig): Bugsnag.Client;

// commonjs/requirejs export
export default bugsnag;
export { Bugsnag };
