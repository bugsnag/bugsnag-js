import Vue from 'vue'
import App from './App.vue'
import Bugsnag from '@bugsnag/js'
import BugsnagVuePlugin from '@bugsnag/plugin-vue'

Bugsnag.start({
  apiKey: 'YOUR_API_KEY',
  plugins: [new BugsnagVuePlugin(Vue)]
})

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')

