import * as BugsnagCore from "@bugsnag/core";

// overwrite config interface, adding react-native-specific options
declare module "@bugsnag/core" {
  interface IConfig {
  }
}

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts?: string | BugsnagCore.IConfig): BugsnagCore.Client;

// commonjs/requirejs export
export default bugsnag;
export { BugsnagCore as Bugsnag };
