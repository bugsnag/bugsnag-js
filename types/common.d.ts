import Client from "./client";
import Report from "./report";

interface IConfig {
  apiKey: string;
  beforeSend?: BeforeSend | BeforeSend[];
  autoBreadcrumbs?: boolean;
  autoNotify?: boolean;
  appVersion?: string;
  endpoint?: string;
  sessionEndpoint?: string;
  sessionTrackingEnabled?: boolean;
  notifyReleaseStages?: string[];
  releaseStage?: string;
  maxEvents?: number;
  maxBreadcrumbs?: number;
  consoleBreadcrumbsEnabled?: boolean;
  navigationBreadcrumbsEnabled?: boolean;
  interactionBreadcrumbsEnabled?: boolean;
  user?: object | null;
  metaData?: object | null;
}

interface IFinalConfig extends IConfig {
  beforeSend: BeforeSend[];
  autoNotify: boolean;
  autoBreadcrumbs: boolean;
  endpoint: string;
  sessionEndpoint: string;
  sessionTrackingEnabled: boolean;
  notifyReleaseStages: string[];
  releaseStage: string;
  maxEvents: number;
  maxBreadcrumbs: number;
  consoleBreadcrumbsEnabled: boolean;
  navigationBreadcrumbsEnabled: boolean;
  interactionBreadcrumbsEnabled: boolean;
  user: object | null;
  metaData: object | null;
}

type BeforeSend = (report: Report) => boolean | void;
type BeforeSession = (client: Client) => void;

export { BeforeSend, BeforeSession, IConfig, IFinalConfig };
