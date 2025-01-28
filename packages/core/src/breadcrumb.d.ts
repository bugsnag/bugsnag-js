import { Breadcrumb } from '../types'

export default class BreadcrumbWithInternals extends Breadcrumb {
  constructor (message: string, metadata: Breadcrumb['metadata'], type: Breadcrumb['type'], timestamp?: Date)
  toJSON(): {
    type: Breadcrumb['type']
    name: Breadcrumb['message']
    timestamp: Breadcrumb['timestamp']
    metaData: Breadcrumb['metadata']
  }
}
