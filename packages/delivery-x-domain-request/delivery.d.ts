import { Delivery } from '@bugsnag/core/client'
import { Client } from '@bugsnag/core'

interface DeliveryXDomainRequest {
  (client: Client, window: Window): Delivery
  _matchPageProtocol(endpoint: string, pageProtocol: string): string
}

declare const delivery: DeliveryXDomainRequest

export default delivery
