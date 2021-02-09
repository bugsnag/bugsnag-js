import { Plugin, Client } from '@bugsnag/core'

interface VueConfig {
  errorHandler?: VueErrorHandler
}

interface VueConstructor {
  config: VueConfig
}

interface VueApp {
  use: (plugin: { install: (app: VueApp, ...options: any[]) => any }) => void
  config: VueConfig
}

type VueErrorHandler = (err: any, instance: any, info: any) => void

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BugsnagPluginVue extends Plugin { }
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
declare class BugsnagPluginVue {
  constructor(Vue?: VueConstructor)
}

export interface BugsnagPluginVueResult {
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
