import { BreadcrumbType } from './common'

declare class Breadcrumb {
  public message: string;
  public metadata: { [key: string]: any };
  public type: BreadcrumbType;
  public timestamp: Date;
}

export default Breadcrumb
