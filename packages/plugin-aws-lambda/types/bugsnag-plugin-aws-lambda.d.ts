import { Plugin, Client } from '@bugsnag/core'

declare const BugsnagPluginAwsLambda: Plugin
export default BugsnagPluginAwsLambda

type AsyncHandler = (event: any, context: any) => Promise<any>
type CallbackHandler = (event: any, context: any, callback: (err?: Error|string|null, response?: any) => void) => void

export type BugsnagPluginAwsLambdaHandler = (handler: AsyncHandler|CallbackHandler) => AsyncHandler

export interface BugsnagPluginAwsLambdaConfiguration {
  flushTimeoutMs?: number
  lambdaTimeoutNotifyMs?: number
}

export interface BugsnagPluginAwsLambdaResult {
  createHandler(configuration?: BugsnagPluginAwsLambdaConfiguration): BugsnagPluginAwsLambdaHandler
}

// add a new call signature for the getPlugin() method that types the plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'awsLambda'): BugsnagPluginAwsLambdaResult | undefined
  }
}
