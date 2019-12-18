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

  public Event: typeof Event;
  public Breadcrumb: typeof Breadcrumb;
  public Session: typeof Session;

  // user
  public getUser(): { id?: string; email?: string; name?: string };
  public setUser(id?: string, email?: string, name?: string): void;

  // sessions
  public startSession(): Client;
  public pauseSession(): void;
  public resumeSession(): Client;

  public use(plugin: common.Plugin, ...args: any[]): Client;
  public getPlugin(name: string): any;
  public notify(
    error: common.NotifiableError,
    onError?: common.OnError,
    cb?: (err: any, event: Event) => void,
  ): void;
  public _notify(
    event: Event,
    onError?: common.OnError,
    cb?: (err: any, event: Event) => void,
  ): void;
  public leaveBreadcrumb(message: string, metadata?: { [key: string]: common.BreadcrumbMetadataValue }, type?: string): void;
}

export default Client;
