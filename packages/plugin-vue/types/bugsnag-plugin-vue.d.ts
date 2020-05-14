import { Plugin, Client } from '@bugsnag/core'
import { VueConstructor } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BugsnagPluginVue extends Plugin { }
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
declare class BugsnagPluginVue {
  constructor(Vue?: VueConstructor)
}

interface BugsnagPluginVueResult {
  installVueErrorHandler(vue?: VueConstructor): void
}

// add a new call signature for the getPlugin() method that types the vue plugin result
declare module '@bugsnag/core' {
  interface Client {
    getPlugin(id: 'vue'): BugsnagPluginVueResult | undefined
  }
}

export default BugsnagPluginVue
