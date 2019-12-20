import { Client, Breadcrumb, Event, Session, AbstractTypes } from "@bugsnag/core";

type afterErrorCb = (err: any, event: Event, logger: AbstractTypes.Logger) => void;

interface NodeConfig extends AbstractTypes.Config {
  hostname?: string;
  onUncaughtException?: afterErrorCb;
  onUnhandledRejection?: afterErrorCb;
  agent?: any;
  projectRoot?: string;
  sendCode?: boolean;
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts: string | NodeConfig): Client;

// commonjs/requirejs export
export default bugsnag;
export { Client, Breadcrumb, Event, Session, AbstractTypes, NodeConfig };
