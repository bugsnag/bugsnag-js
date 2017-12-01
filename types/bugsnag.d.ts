import { Client, IPlugin } from "./client";
import { IConfig } from "./common";
import Report from "./report";

// two ways to call the exported function: apiKey or config object
declare function createBugsnagClient(
  apiKeyOrOpts: string | IConfig,
  plugins?: IPlugin[],
): Client;

// commonjs/requirejs export
export default createBugsnagClient;
export { Client, IPlugin };
