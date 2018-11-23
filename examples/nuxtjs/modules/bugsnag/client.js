import Vue from 'vue'
import bugsnag from '@bugsnag/js'
import bugsnagVue from '@bugsnag/plugin-vue'
const bugsnagClient = bugsnag('<%= options.apiKey %>')
bugsnagClient.use(bugsnagVue, Vue)

export default function ({ app }, inject) {
  inject('bugsnag', bugsnagClient)
}
