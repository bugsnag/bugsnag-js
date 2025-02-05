import { Plugin, Client } from '@bugsnag/core'
import * as hono from 'hono'

declare const bugsnagPluginHono: Plugin
export default bugsnagPluginHono

interface BugsnagPluginHonoResult {
  errorHandler: (err: Error, c: hono.Context) => void
  requestHandler: (c: hono.Context) => void
}

declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'hono'): BugsnagPluginHonoResult | undefined
  }
}

declare module 'hono' {
  export interface Request {
    bugsnag?: Client
  }
}
