import { Client, BrowserConfig } from "@bugsnag/browser";
import { NodeConfig } from "@bugsnag/node";
declare function bugsnag(apiKeyOrOpts: string | NodeConfig | BrowserConfig): Client;
export default bugsnag;
export * from "@bugsnag/browser"
