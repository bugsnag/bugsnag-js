import { BreadcrumbType } from "./common"

export default class Breadcrumb {
  constructor(
    public readonly message: string,
    public readonly metadata: { [key: string]: any },
    public readonly type: BreadcrumbType,
    public readonly timestamp: Date = new Date()
  ) {}

  toJSON () {
    return {
      type: this.type,
      name: this.message,
      timestamp: this.timestamp,
      metaData: this.metadata
    }
  }
}
