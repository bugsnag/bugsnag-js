import { Breadcrumb, Client, Event, Session, AbstractTypes, BrowserConfig } from '@bugsnag/browser';
import { NodeConfig } from '@bugsnag/node';
export { Breadcrumb, Client, Event, Session, AbstractTypes };
declare function bugsnag(apiKeyOrOpts: string | NodeConfig | BrowserConfig): Client;
export default bugsnag;
