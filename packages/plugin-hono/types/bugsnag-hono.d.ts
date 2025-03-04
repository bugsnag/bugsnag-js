import { Plugin, Client } from '@bugsnag/core'
import * as hono from 'hono'

declare const bugsnagPluginHono: Plugin
export default bugsnagPluginHono

interface BugsnagPluginHonoResult {
  errorHandler: (c: hono.Context, err: Error) => void
  requestHandler: hono.MiddlewareHandler
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
