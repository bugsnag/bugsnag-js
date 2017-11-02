import Client from "./client";
import Report from "./report";

// two ways to call the exported function: apiKey or config object
declare function createBugsnagClient(apiKeyOrOpts: string | IConfig): Client;

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

type BeforeSend = (report: Report) => boolean | undefined;

// UMD export
export as namespace bugsnag;

// commonjs/requirejs export
export default createBugsnagClient;
