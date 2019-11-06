declare class Breadcrumb {
  public message: string;
  public metadata: object;
  public type: string;
  public timestamp: string;
  constructor(message: string, metadata?: object, type?: string, timestamp?: string);
}

export default Breadcrumb;
