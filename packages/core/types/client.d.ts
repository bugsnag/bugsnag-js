import Breadcrumb from "./breadcrumb";
import * as common from "./common";
import Event from "./event";
import Session from "./session";

declare class Client {
  public app: object;
  public device: object;
  public context: string | void;

  // metadata
  public addMetadata(section: string, values: { [key: string]: any }): void;
  public addMetadata(section: string, key: string, value: any): void;
  public getMetadata(section: string, key?: string): any;
  public clearMetadata(section: string, key?: string): void;

  public BugsnagEvent: typeof Event;
  public BugsnagBreadcrumb: typeof Breadcrumb;
  public BugsnagSession: typeof Session;

  // user
  public getUser(): { id?: string; email?: string; name?: string };
  public setUser(id?: string, email?: string, name?: string): void;

  public use(plugin: common.Plugin, ...args: any[]): Client;
  public getPlugin(name: string): any;
  public delivery(delivery: common.Delivery): Client;
  public logger(logger: common.Logger): Client;
  public sessionDelegate(sessionDelegate: common.SessionDelegate): Client;
  public notify(
    error: common.NotifiableError,
    onError?: common.OnError,
    cb?: (err: any, event: Event) => void,
  ): void;
  public leaveBreadcrumb(message: string, metadata?: { [key: string]: common.BreadcrumbMetadataValue }, type?: string): Client;
  public startSession(): Client;
}

export default Client;
