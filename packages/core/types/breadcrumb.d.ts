import { BreadcrumbType, BreadcrumbMetadataValue } from './common'

declare class Breadcrumb {
  public message: string;
  public metadata: BreadcrumbMetadataValue;
  public type: BreadcrumbType;
  public timestamp: Date;
}

export default Breadcrumb
