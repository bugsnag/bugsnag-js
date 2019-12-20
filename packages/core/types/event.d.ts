import Breadcrumb from "./breadcrumb";
import * as common from "./common";

declare class Event {
  public static create(
    maybeError: any,
    tolerateNonErrors: boolean,
    handledState: HandledState,
    component: string,
    errorFramesToSkip: number,
    logger?: common.Logger
  ): Event;

  public app: common.App;
  public device: common.Device;
  public request: common.Request;

  public errors: Error[];
  public breadcrumbs: Breadcrumb[];

  public severity: "info" | "warning" | "error";

  public readonly originalError: any;
  public readonly unhandled: boolean;

  public apiKey?: string;
  public context?: string;
  public groupingHash?: string;

  // user
  public getUser(): common.User;
  public setUser(id?: string, email?: string, name?: string): void;

  // metadata
  public addMetadata(section: string, values: { [key: string]: any }): void;
  public addMetadata(section: string, key: string, value: any): void;
  public getMetadata(section: string, key?: string): any;
  public clearMetadata(section: string, key?: string): void;
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

interface Error {
  errorClass: string;
  errorMessage: string;
  stacktrace: Stackframe[];
  type: string;
}

export default Event;
