import Breadcrumb from "./breadcrumb";
import { BeforeSend, IConfig, IFinalConfig } from "./common";
import Report from "./report";

declare class Client {
  public app: object;
  public device: object;
  public context: string | void;
  public config: IFinalConfig;

  public use(plugin: IPlugin): Client;
  public configure(opts: IConfig): Client;
  public transport(transport: ITransport): Client;
  public logger(logger: ILogger): Client;
  public notify(error: any, opts?: INotifyOpts): boolean;
  public leaveBreadcrumb(name: string, metaData?: any, type?: string, timestamp?: string): Client;
}

interface IPlugin {
  init: (client: Client, ReportClass: typeof Report, BreadcrumbClass: typeof Breadcrumb) => void;
  destroy?(): void;
}

interface ITransport {
  name: string;
  sendReport: (config: any, report: IReportPayload, cb?: (e: Error | null, resText: string) => void) => void;
}

interface ILogger {
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

interface IReportPayload {
  apiKey: string;
  notifier: {
    name: string;
    version: string;
    url: string;
  };
  events: Report[];
}

interface INotifyOpts {
  context?: string;
  device?: object;
  request?: object;
  user?: object;
  metaData?: object;
  severity?: "info" | "warning" | "error";
  beforeSend?: BeforeSend;
}

export default Client;
