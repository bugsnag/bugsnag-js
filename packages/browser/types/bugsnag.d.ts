import { Client, Breadcrumb, Event, Session, Config } from "@bugsnag/core";

interface BrowserConfig extends Config {
  maxEvents?: number;
  collectUserIp?: boolean;
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts: string | BrowserConfig): Client;

// commonjs/requirejs export
export default bugsnag;
export { BrowserConfig }
export * from "@bugsnag/core";
