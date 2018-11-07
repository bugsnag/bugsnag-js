import Vue from 'vue'
import bugsnag from '@bugsnag/js'
import bugsnagVue from '@bugsnag/plugin-vue'

const bugsnagClient = bugsnag('YOUR_API_KEY').use(bugsnagVue, Vue)

export default bugsnagClient
