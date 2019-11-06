import Client from "./client";
import Event from "./event";
import * as common from "./common";

export default interface BugsnagStatic {
  init(apiKeyOrOpts: string | common.Config): void;

  createClient(apiKeyOrOpts: string | common.Config): Client;

  // reporting errors
  notify(
    error: common.NotifiableError,
    onError?: common.OnErrorCallback,
    cb?: (err: any, event: Event) => void,
  ): void;

  // breadcrumbs
  leaveBreadcrumb(message: string, metadata?: any, type?: string, timestamp?: string): Client;

  // metadata
  addMetadata(section: string, values: { [key: string]: any }): void;
  addMetadata(section: string, key: string, value: any): void;
  getMetadata(section: string, key?: string): any;
  clearMetadata(section: string, key?: string): void;

  // context
  getContext(): string | undefined;
  setContext(c: string): void;

  // user
  getUser(): { id?: string; email?: string; name?: string };
  setUser(id?: string, email?: string, name?: string): void;

  // reporting sesions
  startSession(): Client;
  pauseSession(): void;
  resumeSession(): Client;

  // callbacks
  addOnError(fn: common.OnErrorCallback): void;
  removeOnError(fn: common.OnErrorCallback): void;

  addOnSession(fn: common.OnSessionCallback): void;
  removeOnSession(fn: common.OnSessionCallback): void;

  addOnBreadcrumb(fn: common.OnBreadcrumbCallback): void;
  removeOnBreadcrumb(fn: common.OnBreadcrumbCallback): void;

  // plugins
  use(plugin: common.Plugin, ...args: any[]): Client;
  getPlugin(name: string): any;
}
