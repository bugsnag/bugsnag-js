import Report from "./report";

interface IConfig {
  apiKey: string;
  beforeSend?: BeforeSend | BeforeSend[];
  autoBreadcrumbs?: boolean;
  autoNotify?: boolean;
  appVersion?: string;
  endpoint?: string;
  notifyReleaseStages?: string[];
  releaseStage?: string;
  maxEvents?: number;
  maxBreadcrumbs?: number;
  consoleBreadcrumbsEnabled?: boolean;
  navigationBreadcrumbsEnabled?: boolean;
  interactionBreadcrumbsEnabled?: boolean;
}

interface IFinalConfig extends IConfig {
  beforeSend: BeforeSend[];
  autoNotify: boolean;
  autoBreadcrumbs: boolean;
  endpoint: string;
  notifyReleaseStages: string[];
  releaseStage: string;
  maxEvents: number;
  maxBreadcrumbs: number;
  consoleBreadcrumbsEnabled: boolean;
  navigationBreadcrumbsEnabled: boolean;
  interactionBreadcrumbsEnabled: boolean;
}

type BeforeSend = (report: Report) => boolean | void;

export { BeforeSend, IConfig, IFinalConfig };
