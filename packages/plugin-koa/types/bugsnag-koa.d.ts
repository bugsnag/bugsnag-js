import { Client, Plugin } from '@bugsnag/core'
import * as Koa from 'koa'
declare const bugsnagPluginKoa: Plugin
export default bugsnagPluginKoa

interface BugsnagPluginKoaResult {
  errorHandler: (err: Error, ctx: Koa.Context) => void
  requestHandler: Koa.Middleware
}

// add a new call signature for the getPlugin() method that types the plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'koa'): BugsnagPluginKoaResult | undefined
  }
}

// define ctx.bugsnag for koa middleware by declaration merging
declare module 'koa' {
  interface BaseContext {
    bugsnag?: Client
  }
}
