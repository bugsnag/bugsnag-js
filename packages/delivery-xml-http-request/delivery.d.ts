import { Delivery } from '@bugsnag/core/client'
import { Client } from '@bugsnag/core'

declare const delivery: (client: Client, window?: Window) => Delivery

export default delivery
