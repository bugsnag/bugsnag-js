import Bugsnag from '@bugsnag/browser'
import BugsnagPluginVue from '@bugsnag/plugin-vue'
import config from './lib/config'

import { createApp, defineComponent } from 'vue'

const App = defineComponent({
  el: '#app',
  data: () => {
    return {
      message: 'Hello Vue!'
    }
  },
  methods: {
    errr: function () {
      throw new Error('borked')
    }
  }
})

Bugsnag.start({ ...config, plugins: [new BugsnagPluginVue] })
createApp(App).use(Bugsnag.getPlugin('vue')!).mount('#app')
