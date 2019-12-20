import { Client, Breadcrumb, Event, Session, AbstractTypes } from "@bugsnag/core";

// two ways to call the exported function: apiKey or config object
declare function bugsnag(apiKeyOrOpts?: string | AbstractTypes.Config): Client;

// commonjs/requirejs export
export default bugsnag;
export { Client, Breadcrumb, Event, Session, AbstractTypes };
