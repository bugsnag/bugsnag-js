import Breadcrumb from "./breadcrumb";
import * as common from "./common";
import Report from "./report";
import Session from "./session";

declare class Client {
  public app: object;
  public device: object;
  public context: string | void;
  public config: common.Config;
  public user: object;
  public metaData: object;

  public BugsnagReport: typeof Report;
  public BugsnagBreadcrumb: typeof Breadcrumb;
  public BugsnagSession: typeof Session;

  public use(plugin: common.Plugin, ...args: any[]): Client;
  public getPlugin(name: string): any;
  public setOptions(opts: common.Config): Client;
  public configure(schema?: common.ConfigSchema): Client;
  public delivery(delivery: common.Delivery): Client;
  public logger(logger: common.Logger): Client;
  public sessionDelegate(sessionDelegate: common.SessionDelegate): Client;
  public notify(
    error: common.NotifiableError,
    opts?: common.NotifyOpts,
    cb?: (err: any, report: Report) => void,
  ): void;
  public leaveBreadcrumb(name: string, metaData?: any, type?: string, timestamp?: string): Client;
  public startSession(): Client;
}

export default Client;
