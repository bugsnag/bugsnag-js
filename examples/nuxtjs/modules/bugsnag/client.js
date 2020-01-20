import Vue from 'vue'
import bugsnag from '@bugsnag/js'
import bugsnagVue from '@bugsnag/plugin-vue'
Bugsnag.start('<%= options.apiKey %>')
Bugsnag.use(bugsnagVue, Vue)

export default function ({ app }, inject) {
  inject('bugsnag', bugsnagClient)
}
