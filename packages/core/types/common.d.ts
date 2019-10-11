import Client from "./client";
import Report from "./report";

export interface IConfig {
  apiKey: string;
  beforeSend?: BeforeSend | BeforeSend[];
  autoBreadcrumbs?: boolean;
  autoNotify?: boolean;
  appVersion?: string;
  appType?: string;
  endpoints?: { notify: string, sessions?: string };
  autoCaptureSessions?: boolean;
  notifyReleaseStages?: string[];
  releaseStage?: string;
  maxBreadcrumbs?: number;
  user?: object | null;
  metaData?: object | null;
  logger?: ILogger | null;
  filters?: Array<string | RegExp>;
  [key: string]: any;
}

export type BeforeSend = (report: Report, cb?: (err: null | Error) => void) => void | Promise<void> | boolean;

export interface IPlugin {
  name?: string;
  init: (client: Client) => any;
  configSchema?: IConfigSchema;
  destroy?(): void;
}

export interface IConfigSchemaEntry {
  message: string;
  validate: (val: any) => boolean;
  defaultValue: () => any;
}

export interface IConfigSchema {
  [key: string]: IConfigSchemaEntry;
}

export interface IDelivery {
  name: string;
  sendReport: (
    logger: ILogger,
    config: any,
    report: IReportPayload,
    cb?: (e: Error | null, resText: string) => void,
  ) => void;
  sendSession: (
    logger: ILogger,
    config: any,
    report: ISessionPayload,
    cb?: (e: Error | null, resText: string) => void,
  ) => void;
}

export interface ILogger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export interface ISessionDelegate {
  startSession: (client: Client) => Client;
}

export interface IReportPayload {  apiKey: string;
  notifier: {
    name: string;
    version: string;
    url: string;
  };
  events: Report[];
}

export interface ISessionPayload {
  notifier: {
    name: string;
    version: string;
    url: string;
  };
  device?: object;
  user?: object;
  app?: object;
  sessions: ISession[];
}

export interface ISession {
  id: string;
  startedAt: string;
  user?: object;
}

export interface INotifyOpts {
  context?: string;
  device?: object;
  request?: object;
  user?: object;
  metaData?: object;
  severity?: "info" | "warning" | "error";
  beforeSend?: BeforeSend;
}

export type NotifiableError = Error
  | { errorClass: string; errorMessage: string; }
  | { name: string; message: string; }
  | any;
