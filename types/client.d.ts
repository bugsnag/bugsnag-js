import Breadcrumb from "./breadcrumb";
import Report from "./report";

declare class Client {
  public use(plugin: IPlugin): Client;
  public transport(transport: ITransport): Client;
  public logger(logger: ILogger): Client;
  public notify(error: any, opts?: INotifyOpts): boolean;
  public leaveBreadcrumb(breadcrumb: Breadcrumb): Client;
  public leaveBreadcrumb(name: string, metaData?: any, timestamp?: string): Client;
}

interface IPlugin {
  init: (client: Client, ReportClass: typeof Report, BreadcrumbClass: typeof Breadcrumb) => Client;
  destroy?(): void;
}

interface ITransport {
  name: string;
  sendReport: (config: any, report: Report, cb?: (e: Error | null, resText: string) => void) => void;
}

interface ILogger {
  debug: (...args: any[]) => void;
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

interface INotifyOpts {
  context?: string;
  device?: object;
  user?: object;
  metaData?: object;
  severity?: "info" | "warning" | "error";
  beforeSend: (report: Report) => boolean | undefined;
}

export default Client;
