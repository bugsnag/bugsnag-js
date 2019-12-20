import { Client, Breadcrumb, Event, Session, AbstractTypes } from "@bugsnag/core";

interface BrowserConfig extends AbstractTypes.Config {
  maxEvents?: number;
  collectUserIp?: boolean;
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts: string | BrowserConfig): Client;

// commonjs/requirejs export
export default bugsnag;
export { Client, Breadcrumb, Event, Session, AbstractTypes, BrowserConfig };
