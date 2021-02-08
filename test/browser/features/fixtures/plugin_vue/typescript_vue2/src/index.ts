import Bugsnag from '@bugsnag/browser'
import BugsnagPluginVue from '@bugsnag/plugin-vue'
import config from './lib/config'

import Vue from 'vue'

Bugsnag.start({ ...config, plugins: [new BugsnagPluginVue] })
Bugsnag.getPlugin('vue')!.installVueErrorHandler(Vue)

const app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  },
  methods: {
    errr: function () {
      throw new Error('borked')
    }
  }
})
