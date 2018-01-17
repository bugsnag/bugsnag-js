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
  autoCaptureSessions?: boolean;
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
  autoCaptureSessions: boolean;
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

type BeforeSend = (
  report: Report,
  cb?: (err: any, send: boolean | void) => void,
) => boolean | void;

type BeforeSession = (client: Client) => void;

export { BeforeSend, BeforeSession, IConfig, IFinalConfig };
