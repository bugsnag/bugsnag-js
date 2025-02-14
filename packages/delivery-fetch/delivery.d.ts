/// <reference lib="webworker" />

import type { Client, Delivery } from '@bugsnag/core'

type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

declare const delivery: (client: Client, fetch?: Fetch, windowOrWorkerGlobalScope?: Window | ServiceWorkerGlobalScope) => Delivery

export default delivery
