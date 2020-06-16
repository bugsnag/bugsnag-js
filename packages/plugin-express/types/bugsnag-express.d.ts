import { Plugin, Client } from '@bugsnag/core'
import * as express from 'express'

declare const bugsnagPluginExpress: Plugin
export default bugsnagPluginExpress

interface BugsnagPluginExpressResult {
  errorHandler: express.ErrorRequestHandler
  requestHandler: express.RequestHandler
}

// add a new call signature for the getPlugin() method that types the plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'express'): BugsnagPluginExpressResult | undefined
  }
}

// define req.bugsnag for express request handlers by declaration merging on the
// global interfaces according to the pattern described in the DefinitelyTyped repo:
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/0bd28530564c3da2e728518084f22648af3a683c/types/express-serve-static-core/index.d.ts#L18-L26
declare global {
  namespace Express {
    export interface Request {
      bugsnag?: Client
    }
  }
}
