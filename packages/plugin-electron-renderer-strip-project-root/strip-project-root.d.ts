import Client from '@bugsnag/core'

declare const plugin: {
  load: (client: Client) => void
}

export default plugin
