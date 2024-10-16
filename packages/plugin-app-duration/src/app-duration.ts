import { Plugin } from 'packages/core/types'

let appStart = new Date()
const reset = () => { appStart = new Date() }

const plugin: Plugin = {
  name: 'appDuration',
  load: client => {
    client.addOnError(event => {
      const now = new Date()

      event.app.duration = Number(now) - Number(appStart)
      // @ts-expect-error second argument is private API
    }, true)

    return { reset }
  }
}

export default plugin
