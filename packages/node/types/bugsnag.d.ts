import * as Bugsnag from "@bugsnag/core";

// augment config interface
declare module "@bugsnag/core" {
  namespace Bugnsag {
    interface IConfig {
      // options for node-specific built-ins
      hostname?: string;
      onUncaughtException?: (err: any, report: Bugsnag.Report, logger: Bugsnag.ILogger) => void;
      onUnhandledRejection?: (err: any, report: Bugsnag.Report, logger: Bugsnag.ILogger) => void;
      proxy?: string;
      projectRoot?: string;
      sendCode?: string;
    }
  }
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts: string | Bugsnag.IConfig): Bugsnag.Client;

// commonjs/requirejs export
export default bugsnag;
export { Bugsnag };
