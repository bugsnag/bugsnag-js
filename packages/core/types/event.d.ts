import Breadcrumb from "./breadcrumb";

declare class Event {
  public static getStacktrace(
    error: any,
    errorFramesToSkip?: number,
    generatedFramesToSkip?: number,
  ): Stackframe[];

  public static ensureEvent(
    eventOrError: any,
    errorFramesToSkip?: number,
    generatedFramesToSkip?: number,
  ): Event;

  public app: {
    releaseStage: string;
    [key: string]: string;
  };
  public apiKey: string;
  public breadcrumbs: Breadcrumb[];
  public context: string;
  public device: object;
  public errorClass: string;
  public errorMessage: string;
  public groupingHash: string;
  public metaData: object;
  public severity: "info" | "warning" | "error";
  public stacktrace: Stackframe[];
  public user: object;
  public session: object;
  public request: {
    url: string;
  };
  public originalError: any;

  constructor(
    errorClass: string,
    errorMessage: string,
    stacktrace?: any[],
    handledState?: HandledState,
    originalError?: any,
  );

  public updateMetaData(section: string, value: object): Event;
  public updateMetaData(section: string, property: string, value: object): Event;
  public removeMetaData(section: string, property: string): Event;
}

interface HandledState {
  severity: string;
  unhandled: boolean;
  severityReason: {
    type: string;
    [key: string]: any;
  };
}

interface Stackframe {
  file: string;
  method?: string;
  lineNumber?: number;
  columnNumber?: number;
  code?: object;
  inProject?: boolean;
}

export default Event;
