import Vue from 'vue'
import App from './App.vue'
import Bugsnag from '@bugsnag/js'
import bugsnagVue from '@bugsnag/plugin-vue'

Bugsnag.init('YOUR_API_KEY')
Bugsnag.use(bugsnagVue, Vue)

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
