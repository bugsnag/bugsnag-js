import Client from "./client";
import Event from "./event";

export interface Config {
  apiKey: string;
  beforeSend?: BeforeSend | BeforeSend[];
  autoBreadcrumbs?: boolean;
  autoDetectErrors?: boolean;
  autoDetectUnhandledRejections?: boolean;
  appVersion?: string;
  appType?: string;
  endpoints?: { notify: string; sessions: string };
  autoTrackSessions?: boolean;
  notifyReleaseStages?: string[];
  releaseStage?: string;
  maxBreadcrumbs?: number;
  user?: object | null;
  metaData?: object | null;
  logger?: Logger | null;
  filters?: Array<string | RegExp>;
  [key: string]: any;
}

export type BeforeSend = (event: Event, cb?: (err: null | Error) => void) => void | Promise<void> | boolean;

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

export interface Delivery {
  name: string;
  sendEvent: (
    logger: Logger,
    config: any,
    event: EventPayload,
    cb?: (e: Error | null, resText: string) => void,
  ) => void;
  sendSession: (
    logger: Logger,
    config: any,
    event: SessionPayload,
    cb?: (e: Error | null, resText: string) => void,
  ) => void;
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

export interface NotifyOpts {
  context?: string;
  device?: object;
  request?: object;
  user?: object;
  metaData?: object;
  severity?: "info" | "warning" | "error";
  beforeSend?: BeforeSend;
}

export type NotifiableError = Error
  | { errorClass: string; errorMessage: string }
  | { name: string; message: string }
  | any;
