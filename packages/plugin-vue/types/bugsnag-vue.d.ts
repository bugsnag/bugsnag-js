import { Plugin } from '@bugsnag/browser'
import Vue from 'vue'

declare class BugsnagPluginVue extends Plugin {
  constructor(Vue?: Vue)
}

export default bugsnagPluginVue
