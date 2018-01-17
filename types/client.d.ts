import Breadcrumb from "./breadcrumb";
import { BeforeSend, IConfig, IFinalConfig } from "./common";
import Report from "./report";

export class Client {
  public app: object;
  public device: object;
  public context: string | void;
  public config: IFinalConfig;

  public BugsnagReport: typeof Report;
  public BugsnagBreadcrumb: typeof Breadcrumb;

  public use(plugin: IPlugin): any;
  public configure(opts: IConfig): Client;
  public transport(transport: ITransport): Client;
  public logger(logger: ILogger): Client;
  public notify(error: NotifiableError, opts?: INotifyOpts): boolean;
  public leaveBreadcrumb(name: string, metaData?: any, type?: string, timestamp?: string): Client;
}

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

export interface ITransport {
  name: string;
  sendReport: (
    logger: ILogger,
    config: any,
    report: IReportPayload,
    cb?: (e: Error | null, resText: string) => void,
  ) => void;
}

export interface ILogger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export interface IReportPayload {
  apiKey: string;
  notifier: {
    name: string;
    version: string;
    url: string;
  };
  events: Report[];
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

export default Client;
