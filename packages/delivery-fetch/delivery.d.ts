/// <reference lib="webworker" />

import type { Client } from '@bugsnag/core'
import type { Delivery } from '@bugsnag/core/client'

type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

declare const delivery: (client: Client, fetch?: Fetch, windowOrWorkerGlobalScope?: Window | ServiceWorkerGlobalScope) => Delivery

export default delivery
