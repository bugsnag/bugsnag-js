import { Plugin } from '@bugsnag/core'
import { VueConstructor } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BugsnagPluginVue extends Plugin { }
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
declare class BugsnagPluginVue {
  constructor(Vue?: VueConstructor)
}

export default BugsnagPluginVue
