import { Client, Event, Logger, Config, BugsnagStatic } from '@bugsnag/core'

type AfterErrorCb = (err: any, event: Event, logger: Logger) => void;

interface NodeDeliveryOptions {
  maxInFlight?: number
  timeoutMs?: number
  maxRequestBytes?: number
  maxResponseBytes?: number
}

interface NodeDeliveryResult {
  kind: 'event' | 'session'
  status: 'success' | 'failed' | 'rejected'
  reason: 'success' | 'capacity' | 'timeout' | 'request_size' | 'response_size' | 'closed' | 'http' | 'transport' | 'serialization' | 'configuration'
}

interface NodeConfig extends Config {
  hostname?: string
  onUncaughtException?: AfterErrorCb
  onUnhandledRejection?: AfterErrorCb
  agent?: any
  projectRoot?: string
  sendCode?: boolean
  deliveryOptions?: NodeDeliveryOptions
  onDelivery?: (result: NodeDeliveryResult) => void
}

interface NodeBugsnagStatic extends BugsnagStatic {
  start(apiKeyOrOpts: string | NodeConfig): Client
  createClient(apiKeyOrOpts: string | NodeConfig): Client
}

declare const Bugsnag: NodeBugsnagStatic

export default Bugsnag
export * from '@bugsnag/core'
export { NodeConfig, NodeDeliveryOptions, NodeDeliveryResult }
