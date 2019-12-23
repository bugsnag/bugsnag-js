import { Client, Config, BrowserConfig, BugsnagStatic } from "@bugsnag/browser";
import { NodeConfig } from "@bugsnag/node";

interface UniversalBugsnagStatic extends BugsnagStatic {
  init(apiKeyOrOpts: string | BrowserConfig | NodeConfig): void;
  createClient(apiKeyOrOpts: string | BrowserConfig | NodeConfig): Client;
}

declare const Bugsnag: UniversalBugsnagStatic;

export default Bugsnag;
export * from "@bugsnag/browser"
