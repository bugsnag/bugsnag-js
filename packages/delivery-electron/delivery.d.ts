import { Client, Delivery } from '@bugsnag/core'

declare const delivery: (filestore: any, net: any, app: any) => (client: Client) => Delivery

export default delivery
