import { Plugin, Client } from '@bugsnag/core'

interface VueConfig {
  errorHandler?: VueErrorHandler | null
}

interface VueConstructor {
  config: VueConfig
}

interface VueApp {
  use: (plugin: { install: (app: VueApp) => void }) => void
  config: VueConfig
}

type VueErrorHandler = (err: Error, vm: object, info: string | number) => void

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BugsnagPluginVue extends Plugin { }
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
declare class BugsnagPluginVue {
  constructor(Vue?: VueConstructor)
}

interface BugsnagPluginVueResult {
  install(app: VueApp): void
  installVueErrorHandler(vue?: VueConstructor): void
}

// add a new call signature for the getPlugin() method that types the vue plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'vue'): BugsnagPluginVueResult | undefined
  }
}

export default BugsnagPluginVue
