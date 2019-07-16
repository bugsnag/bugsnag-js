import Breadcrumb from "./breadcrumb";
import * as common from "./common";

declare class Report {
  public static getStacktrace(
    error: any,
    errorFramesToSkip?: number,
    generatedFramesToSkip?: number,
  ): IStackframe[];

  public static ensureReport(
    reportOrError: any,
    errorFramesToSkip?: number,
    generatedFramesToSkip?: number,
  ): Report;

  public originalError: any;

  constructor(
    errorClass: string,
    errorMessage: string,
    stacktrace?: any[],
    handledState?: IHandledState,
    originalError?: any,
  );

  public isIgnored(): boolean;
  public ignore(): void;

  public set(updates: common.IStateUpdateObj): void;
  public set(key: string, ...args: any[]): void;
  public get(key: string, ...nestedKeys: string[]): any;
  public clear(key: string, ...nestedKeys: string[]): void;
}

interface IHandledState {
  severity: string;
  unhandled: boolean;
  severityReason: {
    type: string;
    [key: string]: any;
  };
}

interface IStackframe {
  file: string;
  method?: string;
  lineNumber?: number;
  columnNumber?: number;
  code?: object;
  inProject?: boolean;
}

export default Report;
