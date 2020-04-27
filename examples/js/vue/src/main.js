import Vue from 'vue'
import App from './App.vue'
import Bugsnag from '@bugsnag/js'
import BugsnagPluginVue from '@bugsnag/plugin-vue'

Bugsnag.start({
  apiKey: 'YOUR_API_KEY',
  plugins: [new BugsnagPluginVue(Vue)]
})

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')

