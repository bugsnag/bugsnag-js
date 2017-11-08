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
}

type BeforeSend = (report: Report) => boolean | void;

export { BeforeSend, IConfig, IFinalConfig };
