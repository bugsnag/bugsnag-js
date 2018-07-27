declare class Breadcrumb {
  public name: string;
  public metaData: object;
  public type: string;
  public timestamp: string;
  constructor(name: string, metaData?: object, type?: string, timestamp?: string);
}

export default Breadcrumb;
