import Report from "./report";

interface IConfig {
  apiKey: string;
  beforeSend?: BeforeSend | BeforeSend[];
  autoNotify?: boolean;
  endpoint?: string;
  notifyReleaseStages?: string[];
  releaseStage?: string;
  eventWindowSize?: number;
  maxEventsPerWindow?: number;
  maxDuplicateEventsPerWindow?: number;
  maxBreadcrumbs?: number;
  projectRoot?: string;
}

interface IFinalConfig extends IConfig {
  beforeSend: BeforeSend[];
  autoNotify: boolean;
  endpoint: string;
  notifyReleaseStages: string[];
  releaseStage: string;
  eventWindowSize: number;
  maxEventsPerWindow: number;
  maxDuplicateEventsPerWindow: number;
  maxBreadcrumbs: number;
  projectRoot: string;
}

type BeforeSend = (report: Report) => boolean | void;

export { BeforeSend, IConfig, IFinalConfig };
