import { BreadcrumbType } from './common'

declare class Breadcrumb {
  public constructor(message: string, metadata: { [key: string]: any }, type: BreadcrumbType, timestamp?: Date)
  public message: string;
  public metadata: { [key: string]: any };
  public type: BreadcrumbType;
  public timestamp: Date;
}

export default Breadcrumb
