import * as Bugsnag from "@bugsnag/core";

// two ways to call the exported function: apiKey or config object
declare function bugsnag(
  apiKeyOrOpts: string | Bugsnag.IConfig,
  plugins?: Bugsnag.IPlugin[],
): Bugsnag.Client;

// commonjs/requirejs export
export default bugsnag;
export { Bugsnag };
