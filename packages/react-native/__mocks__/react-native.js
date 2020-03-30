/* global jest */

const events = []

module.exports = jest.fn()
module.exports.NativeModules = {
  BugsnagReactNative: {
    configure: () => ({
      apiKey: 'abab1212abab1212abab1212abab1212',
      enabledBreadcrumbTypes: []
    }),
    leaveBreadcrumb: () => {},
    dispatch: async (event) => {
      events.push(event)
    },
    getPayloadInfo: async () => ({
      threads: [],
      breadcrumbs: [],
      app: {},
      device: {}
    }),
    _events: events,
    _clear: () => { while (events.length) events.pop() }
  }
}
module.exports.Platform = {
  OS: 'android'
}
