import Breadcrumb from "./breadcrumb";
import * as common from "./common";
import Report from "./report";
import Session from "./session";

declare class Client {
  public BugsnagReport: typeof Report;
  public BugsnagBreadcrumb: typeof Breadcrumb;
  public BugsnagSession: typeof Session;

  private config: common.IConfig;

  public set(updates: common.IStateUpdateObj): void;
  public set(key: string, ...args: any[]): void;
  public get(key: string, ...nestedKeys: string[]): any;
  public clear(key: string, ...nestedKeys: string[]): void;

  public use(plugin: common.IPlugin, ...args: any[]): Client;
  public getPlugin(name: string): any;

  public setOptions(opts: common.IConfig): Client;
  public configure(schema?: common.IConfigSchema): Client;

  public delivery(delivery: common.IDelivery): Client;

  public logger(logger: common.ILogger): Client;

  public sessionDelegate(sessionDelegate: common.ISessionDelegate): Client;

  public notify(
    error: common.NotifiableError,
    beforeSend?: common.BeforeSend,
    cb?: (err: any, report: Report) => void,
  ): void;

  public leaveBreadcrumb(name: string, metaData?: any, type?: string, timestamp?: string): Client;

  public startSession(): Client;
}

export default Client;
