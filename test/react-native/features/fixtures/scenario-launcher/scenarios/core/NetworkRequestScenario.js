import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import {createNetworkInstrumentationPlugin as BugsnagPluginNetworkInstrumentation} from '@bugsnag/plugin-network-instrumentation'

export class NetworkRequestScenario extends Scenario {
  constructor (nativeConfig, jsConfig, scenarioData) {
    super()
    this.reflectEndpoint = nativeConfig.endpoints.notify.replace('/notify', '/reflect')
    this.statusCode = scenarioData

    const plugin = BugsnagPluginNetworkInstrumentation({
      maxRequestSize: 1024,
      maxResponseSize: 1024
    })

    jsConfig.plugins = jsConfig.plugins || []
    jsConfig.plugins.push(plugin)
  }

  run () {
    fetch(`${this.reflectEndpoint}?status=${this.statusCode}`).catch((err) => {
      Bugsnag.notify(err)
    })
  }
}
