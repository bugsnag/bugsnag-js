import { Plugin } from '@bugsnag/core'
declare const BugsnagPluginCloudflareWorkers: Plugin
export default BugsnagPluginCloudflareWorkers
export interface BugsnagPluginCloudflareWorkersConfiguration {
  flushTimeoutMs?: number
}
export interface BugsnagPluginCloudflareWorkersResult {
  createHandler(configuration?: BugsnagPluginCloudflareWorkersConfiguration): <T>(handler: T) => T
}

// add a new call signature for the getPlugin() method that types the plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'cloudflareWorkers'): BugsnagPluginCloudflareWorkersResult | undefined
  }
}
