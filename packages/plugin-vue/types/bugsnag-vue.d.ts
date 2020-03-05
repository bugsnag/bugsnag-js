import { Bugsnag } from '@bugsnag/browser'
import Vue from 'vue'

declare class BugsnagPluginVue extends Bugsnag.Plugin {
  constructor(Vue?: Vue)
}

export default bugsnagPluginVue
