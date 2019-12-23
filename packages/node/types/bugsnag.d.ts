import { Client, Event, Logger, Config, BugsnagStatic } from "@bugsnag/core";

type AfterErrorCb = (err: any, event: Event, logger: Logger) => void;

interface NodeConfig extends Config {
  hostname?: string;
  onUncaughtException?: AfterErrorCb;
  onUnhandledRejection?: AfterErrorCb;
  agent?: any;
  projectRoot?: string;
  sendCode?: boolean;
}

interface NodeBugsnagStatic extends BugsnagStatic {
  init(apiKeyOrOpts: string | NodeConfig): void;
  createClient(apiKeyOrOpts: string | NodeConfig): Client;
}

declare const Bugsnag: NodeBugsnagStatic;

export default Bugsnag;
export * from "@bugsnag/core";
export { NodeConfig };
