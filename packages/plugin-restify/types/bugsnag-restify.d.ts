import { Client, Plugin } from '@bugsnag/core'
import restify from 'restify'

declare const bugsnagPluginRestify: Plugin
export default bugsnagPluginRestify

interface BugsnagPluginRestifyResult {
  requestHandler: restify.RequestHandler
  errorHandler: (req: restify.Request, res: restify.Response, err: Error, cb: (...args: any[]) => void) => void
}

// add a new call signature for the getPlugin() method that types the plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'restify'): BugsnagPluginRestifyResult | undefined
  }
}

declare module 'restify' {
  interface Request {
    /**
     * @deprecated use `Bugsnag` instead
     */
    bugsnag?: Client
  }
}
