import { Client, Delivery } from '@bugsnag/core'

declare const delivery: (client: Client) => Delivery

export default delivery
