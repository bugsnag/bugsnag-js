import type { Client } from '@bugsnag/core'
import type { Delivery } from '@bugsnag/core/client'

declare const delivery: (client: Client, fetch?: GlobalFetch['fetch']) => Delivery

export default delivery
