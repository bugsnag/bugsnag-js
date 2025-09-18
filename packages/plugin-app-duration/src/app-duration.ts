import { Plugin } from '@bugsnag/core'

let appStart = new Date()
const reset = () => { appStart = new Date() }

const plugin: Plugin = {
  name: 'appDuration',
  load: client => {
    client.addOnError(event => {
      const now = new Date()

      event.app.duration = Number(now) - Number(appStart)
    }, true)

    return { reset }
  }
}

export default plugin
