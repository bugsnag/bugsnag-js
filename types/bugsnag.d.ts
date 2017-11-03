import Client from "./client";
import { IConfig } from "./common";
import Report from "./report";

// two ways to call the exported function: apiKey or config object
declare function createBugsnagClient(apiKeyOrOpts: string | IConfig): Client;

// UMD export
export as namespace bugsnag;

// commonjs/requirejs export
export default createBugsnagClient;
