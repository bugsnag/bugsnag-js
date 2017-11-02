import Breadcrumb from "./breadcrumb";

declare class Report {
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
  public stacktrace: IStackframe[];
  public user: object;

  public isIgnored(): boolean;
  public ignore(): void;
  public updateMetaData(section: string, value: object): Report;
  public updateMetaData(section: string, property: string, value: object): Report;
  public removeMetaData(section: string, property: string): Report;
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
