import Breadcrumb from "./breadcrumb";
import Client from "./client";
import Event from "./event";
import Session from "./session";
import BugsnagStatic from "./bugsnag";

export interface Config {
  apiKey: string;
  appVersion?: string;
  appType?: string;
  autoDetectErrors?: boolean;
  autoDetectUnhandledRejections?: boolean;
  onError?: OnErrorCallback | OnErrorCallback[];
  endpoints?: { notify: string; sessions?: string };
  autoTrackSessions?: boolean;
  enabledReleaseStages?: string[];
  releaseStage?: string;
  maxBreadcrumbs?: number;
  enabledBreadcrumbTypes?: BreadcrumbType[];
  user?: { id?: string; name?: string; email?: string } | null;
  metadata?: object | null;
  logger?: Logger | null;
  redactedKeys?: Array<string | RegExp>;
  context?: string;
  [key: string]: any;
}

export type OnErrorCallback = (event: Event, cb?: (err: null | Error) => void) => void | Promise<void> | boolean;
export type OnSessionCallback = (session: Session) => void | boolean;
export type OnBreadcrumbCallback = (breadcrumb: Breadcrumb) => void | boolean;

export type BreadcrumbType = "error" | "log" | "manual" | "navigation" | "process" | "request" | "state" | "user";

export interface Plugin {
  name?: string;
  init: (client: Client) => any;
  configSchema?: ConfigSchema;
  destroy?(): void;
}

export interface ConfigSchemaEntry {
  message: string;
  validate: (val: any) => boolean;
  defaultValue: () => any;
}

export interface ConfigSchema {
  [key: string]: ConfigSchemaEntry;
}

export interface Logger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export type NotifiableError = Error
  | { errorClass: string; errorMessage: string }
  | { name: string; message: string }
  | any;

export { BugsnagStatic }

export interface Configuration {
  load: () => object;
}
