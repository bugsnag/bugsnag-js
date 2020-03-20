import { Plugin } from '@bugsnag/core'
import Vue from 'vue'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BugsnagPluginVue extends Plugin { }
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
declare class BugsnagPluginVue {
  constructor(Vue?: Vue)
}

export default bugsnagPluginVue
