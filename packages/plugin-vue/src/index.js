const installVue2 = require('./vue2')
const installVue = require('./vue')

module.exports = class BugsnagPluginVue {
  constructor (...args) {
    // Fetch Vue from the window object, if it exists
    const globalVue = typeof window !== 'undefined' && window.Vue

    this.name = 'vue'
    this.lazy = args.length === 0 && !globalVue

    if (!this.lazy) {
      this.Vue = args[0] || globalVue
      if (!this.Vue) throw new Error('@bugsnag/plugin-vue reference to `Vue` was undefined')
    }
  }

  load (client) {
    if (this.Vue && this.Vue.config) {
      installVue2(this.Vue, client)
      return {
        installVueErrorHandler: () => client._logger.warn('installVueErrorHandler() was called unnecessarily')
      }
    }
    return {
      install: (app) => {
        if (!app) client._logger.error(new Error('@bugsnag/plugin-vue reference to Vue `app` was undefined'))
        installVue(app, client)
      },
      installVueErrorHandler: Vue => {
        if (!Vue) client._logger.error(new Error('@bugsnag/plugin-vue reference to `Vue` was undefined'))
        installVue2(Vue, client)
      }
    }
  }
}

// add a default export for ESM modules without interop
module.exports.default = module.exports
