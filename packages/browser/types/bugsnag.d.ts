import { Client, Config, BugsnagStatic } from "@bugsnag/core";

interface BrowserConfig extends Config {
  maxEvents?: number;
  collectUserIp?: boolean;
}

interface BrowserBugsnagStatic extends BugsnagStatic {
  init(apiKeyOrOpts: string | BrowserConfig): void;
  createClient(apiKeyOrOpts: string | BrowserConfig): Client;
}

declare const Bugsnag: BrowserBugsnagStatic;

export default Bugsnag;
export * from "@bugsnag/core";
export { BrowserConfig }
