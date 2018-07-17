import Client from "./client";
import Report from "./report";

export interface IConfig {
  apiKey: string;
  beforeSend?: BeforeSend | BeforeSend[];
  autoBreadcrumbs?: boolean;
  autoNotify?: boolean;
  appVersion?: string;
  endpoint?: string;
  sessionEndpoint?: string;
  endpoints?: { notify: string, sessions: string };
  autoCaptureSessions?: boolean;
  notifyReleaseStages?: string[];
  releaseStage?: string;
  maxEvents?: number;
  maxBreadcrumbs?: number;
  consoleBreadcrumbsEnabled?: boolean;
  networkBreadcrumbsEnabled?: boolean;
  navigationBreadcrumbsEnabled?: boolean;
  interactionBreadcrumbsEnabled?: boolean;
  user?: object | null;
  metaData?: object | null;
  collectUserIp?: boolean;
  logger?: ILogger | null;
}

export interface IFinalConfig extends IConfig {
  beforeSend: BeforeSend[];
  autoNotify: boolean;
  autoBreadcrumbs: boolean;
  endpoints: { notify: string, sessions: string };
  autoCaptureSessions: boolean;
  notifyReleaseStages: string[];
  releaseStage: string;
  maxEvents: number;
  maxBreadcrumbs: number;
  consoleBreadcrumbsEnabled: boolean;
  networkBreadcrumbsEnabled?: boolean;
  navigationBreadcrumbsEnabled: boolean;
  interactionBreadcrumbsEnabled: boolean;
  user: object | null;
  metaData: object | null;
  collectUserIp: boolean;
  logger?: ILogger | null;
}

type SyncBeforeSend = (report: Report) => void;
type AsyncBeforeSend = (report: Report, cb: (err: null | Error) => void) => void;
type PromiseBeforeSend = (report: Report) => Promise<void>;

export type BeforeSend = SyncBeforeSend | AsyncBeforeSend | PromiseBeforeSend;

export interface IPlugin {
  configSchema?: { [key: string]: IConfigSchemaEntry; };
  init: (client: Client) => any;
  destroy?(): void;
}

export interface IConfigSchemaEntry {
  message: string;
  validate: (val: any) => boolean;
  defaultValue: () => any;
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
