import { Plugin, Client } from '@bugsnag/core'

declare const BugsnagPluginCloudflareWorkers: Plugin
export default BugsnagPluginCloudflareWorkers

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void
}

type CloudflareWorkersHandler = (request: Request, env: any, ctx: ExecutionContext) => Promise<Response>

export type BugsnagPluginCloudflareWorkersHandler = (handler: CloudflareWorkersHandler) => CloudflareWorkersHandler

export interface BugsnagPluginCloudflareWorkersConfiguration {
  flushTimeoutMs?: number
}

export interface BugsnagPluginCloudflareWorkersResult {
  createHandler(configuration?: BugsnagPluginCloudflareWorkersConfiguration): BugsnagPluginCloudflareWorkersHandler
}

// add a new call signature for the getPlugin() method that types the plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'cloudflareWorkers'): BugsnagPluginCloudflareWorkersResult | undefined
  }
}
