import { Delivery } from '@bugsnag/core/client'
import { Client } from '@bugsnag/core'
import nodeFetch from 'node-fetch'

declare const delivery: (client: Client, fetch?: typeof nodeFetch) => Delivery

export default delivery
