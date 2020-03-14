import Vue from 'vue'
import Bugsnag from '@bugsnag/js'
import BugsnagPluginVue from '@bugsnag/plugin-vue'

Bugsnag.start({
  apiKey:'<%= options.apiKey %>',
  plugins: [new BugsnagPluginVue(Vue)]
})
