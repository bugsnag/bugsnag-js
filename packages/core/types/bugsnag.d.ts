import Client from "./client";
import Event from "./event";
import {
  BreadcrumbType,
  BreadcrumbMetadataValue,
  Config,
  NotifiableError,
  OnErrorCallback,
  OnSessionCallback,
  OnBreadcrumbCallback,
  User,
  Plugin
} from "./common";

export default interface BugsnagStatic {
  init(apiKeyOrOpts: string | Config): void;

  createClient(apiKeyOrOpts: string | Config): Client;

  // reporting errors
  notify(
    error: NotifiableError,
    onError?: OnErrorCallback,
    cb?: (err: any, event: Event) => void
  ): void;

  // breadcrumbs
  leaveBreadcrumb(
    message: string,
    metadata?: { [key: string]: BreadcrumbMetadataValue },
    type?: BreadcrumbType
  ): void;

  // metadata
  addMetadata(section: string, values: { [key: string]: any }): void;
  addMetadata(section: string, key: string, value: any): void;
  getMetadata(section: string, key?: string): any;
  clearMetadata(section: string, key?: string): void;

  // context
  getContext(): string | undefined;
  setContext(c: string): void;

  // user
  getUser(): User;
  setUser(id?: string, email?: string, name?: string): void;

  // sessions
  startSession(): Client;
  pauseSession(): void;
  resumeSession(): Client;

  // callbacks
  addOnError(fn: OnErrorCallback): void;
  removeOnError(fn: OnErrorCallback): void;

  addOnSession(fn: OnSessionCallback): void;
  removeOnSession(fn: OnSessionCallback): void;

  addOnBreadcrumb(fn: OnBreadcrumbCallback): void;
  removeOnBreadcrumb(fn: OnBreadcrumbCallback): void;

  // plugins
  use(plugin: Plugin, ...args: any[]): Client;
  getPlugin(name: string): any;
}
