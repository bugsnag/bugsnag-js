import { Client, Breadcrumb, Event, Session, Logger, Config } from "@bugsnag/core";

type AfterErrorCb = (err: any, event: Event, logger: Logger) => void;

interface NodeConfig extends Config {
  hostname?: string;
  onUncaughtException?: AfterErrorCb;
  onUnhandledRejection?: AfterErrorCb;
  agent?: any;
  projectRoot?: string;
  sendCode?: boolean;
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts: string | NodeConfig): Client;

// commonjs/requirejs export
export default bugsnag;
export * from "@bugsnag/core";
export { NodeConfig };
