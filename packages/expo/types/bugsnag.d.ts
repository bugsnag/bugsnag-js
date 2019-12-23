import { Client, Config } from "@bugsnag/core";

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts?: string | Config): Client;

// commonjs/requirejs export
export default bugsnag;
export * from "@bugsnag/core";
