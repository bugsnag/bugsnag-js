import { Plugin, Client } from '@bugsnag/core'

declare const BugsnagPluginAzureFunctions: Plugin
export default BugsnagPluginAzureFunctions

type AsyncHandler = (context: any, ...args: any[]) => Promise<any>

export type BugsnagPluginAzureFunctionsHandler = (handler: AsyncHandler) => AsyncHandler

export interface BugsnagPluginAzureFunctionsConfiguration {
  flushTimeoutMs?: number
}

export interface BugsnagPluginAzureFunctionsResult {
  createHandler(configuration?: BugsnagPluginAzureFunctionsConfiguration): BugsnagPluginAzureFunctionsHandler
}

// add a new call signature for the getPlugin() method that types the plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'azureFunctions'): BugsnagPluginAzureFunctionsResult | undefined
  }
}
