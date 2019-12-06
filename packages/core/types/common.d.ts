import Client from "./client";
import Event from "./event";
import Session from "./session";
import Breadcrumb from "./breadcrumb";

export interface Config {
  apiKey: string;
  onError?: OnError | OnError[];
  onBreadcrumb?: OnBreadcrumb | OnBreadcrumb[];
  onSession?: OnSession | OnSession[];
  enabledBreadcrumbTypes?: BreadcrumbType[];
  autoDetectErrors?: boolean;
  autoDetectUnhandledRejections?: boolean;
  appVersion?: string;
  appType?: string;
  endpoints?: { notify: string; sessions: string };
  autoTrackSessions?: boolean;
  enabledReleaseStages?: string[];
  releaseStage?: string;
  maxBreadcrumbs?: number;
  user?: object | null;
  metadata?: { [key: string]: any };
  logger?: Logger | null;
  filters?: Array<string | RegExp>;
  [key: string]: any;
}

export type OnError = (event: Event, cb?: (err: null | Error) => void) => void | Promise<void> | boolean;
export type OnSession = (session: Session) => boolean;
export type OnBreadcrumb = (breadcrumb: Breadcrumb) => boolean;

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

export interface SessionDelegate {
  startSession: (client: Client) => Client;
}

export interface EventPayload {  apiKey: string;
  notifier: {
    name: string;
    version: string;
    url: string;
  };
  events: Event[];
}

export interface SessionPayload {
  notifier: {
    name: string;
    version: string;
    url: string;
  };
  device?: object;
  user?: object;
  app?: object;
  sessions: Session[];
}

export interface Session {
  id: string;
  startedAt: string;
  user?: object;
}

export type NotifiableError = Error
  | { errorClass: string; errorMessage: string }
  | { name: string; message: string }
  | any;

type Primitive = boolean | string | number | undefined | null;
export type BreadcrumbMetadataValue = Primitive | Array<Primitive>;

export type BreadcrumbType = "error" | "log" | "manual" | "navigation" | "process" | "request" | "state" | "user";
