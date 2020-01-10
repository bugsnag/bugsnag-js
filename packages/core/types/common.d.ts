import Client from "./client";
import Event from "./event";
import Session from "./session";
import Breadcrumb from "./breadcrumb";

export interface Config {
  apiKey: string;
  appVersion?: string;
  appType?: string;
  autoDetectErrors?: boolean;
  autoDetectUnhandledRejections?: boolean;
  autoTrackSessions?: boolean;
  context?: string;
  enabledBreadcrumbTypes?: BreadcrumbType[];
  enabledReleaseStages?: string[];
  endpoints?: { notify: string; sessions: string };
  filters?: Array<string | RegExp>;
  onBreadcrumb?: OnBreadcrumbCallback | OnBreadcrumbCallback[];
  onError?: OnErrorCallback | OnErrorCallback[];
  onSession?: OnSessionCallback | OnSessionCallback[];
  logger?: Logger | null;
  maxBreadcrumbs?: number;
  metadata?: { [key: string]: any };
  releaseStage?: string;
  user?: {} | null;
}

export type OnErrorCallback = (event: Event, cb?: (err: null | Error) => void) => void | Promise<void> | boolean;
export type OnSessionCallback = (session: Session) => void | boolean;
export type OnBreadcrumbCallback = (breadcrumb: Breadcrumb) => void | boolean;

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
  device?: Device;
  user?: User;
  app?: App;
  sessions: Session[];
}

export type NotifiableError = Error
  | { errorClass: string; errorMessage: string }
  | { name: string; message: string }
  | any;

type Primitive = boolean | string | number | undefined | null;
export type BreadcrumbMetadataValue = Primitive | Array<Primitive>;

export type BreadcrumbType = "error" | "log" | "manual" | "navigation" | "process" | "request" | "state" | "user";

interface Device {
  id?: string;
  hostname?: string;
  locale?: string;
  manufacturer?: string;
  model?: string;
  modelNumber?: string;
  orientation?: string;
  osName?: string;
  osVersion?: string;
  runtimeVersions?: {
    [key: string]: any;
  };
  time?: string;
  userAgent?: string;
  [key: string]: any;
}

interface App {
  codeBundleId?: string;
  duration?: number;
  durationInForeground?: number;
  inForeground?: boolean;
  releaseStage?: string;
  type?: string;
  version?: string;
  [key: string]: any;
}

interface Request {
  clientIp?: string;
  headers?: { [key: string]: string };
  httpMethod?: string;
  referer?: string;
  url?: string;
  [key: string]: any;
}

export interface User {
  id?: string;
  email?: string;
  name?: string
}
