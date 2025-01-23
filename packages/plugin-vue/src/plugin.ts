import installVue2 from './vue2'
import installVue from './vue'
import { Client } from '@bugsnag/core'
import { VueApp } from './types'

declare global {
  interface Window {
    Vue: VueApp
  }
}

export default class BugsnagPluginVue {
  public readonly name: string;
  private readonly lazy: boolean;
  private readonly Vue?: VueApp

  constructor (...args: any[]) {
    // Fetch Vue from the window object, if it exists
    const globalVue = typeof window !== 'undefined' && window.Vue

    this.name = 'vue'
    this.lazy = args.length === 0 && !globalVue

    if (!this.lazy) {
      this.Vue = args[0] || globalVue
      if (!this.Vue) throw new Error('@bugsnag/plugin-vue reference to `Vue` was undefined')
    }
  }

  load (client: Client) {
    if (this.Vue && this.Vue.config) {
      installVue2(this.Vue, client)
      return {
        // @ts-ignore internal API
        installVueErrorHandler: () => client._logger.warn('installVueErrorHandler() was called unnecessarily')
      }
    }
    return {
      install: (app: VueApp) => {
        // @ts-ignore internal API
        if (!app) client._logger.error(new Error('@bugsnag/plugin-vue reference to Vue `app` was undefined'))
        installVue(app, client)
      },
      installVueErrorHandler: (Vue: VueApp) => {
        // @ts-ignore internal API
        if (!Vue) client._logger.error(new Error('@bugsnag/plugin-vue reference to `Vue` was undefined'))
        installVue2(Vue, client)
      }
    }
  }
}
