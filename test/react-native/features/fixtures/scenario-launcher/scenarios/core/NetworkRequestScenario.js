import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'
import BugsnagPluginNetworkInstrumentation from '@bugsnag/plugin-network-instrumentation'

export class NetworkRequestScenario extends Scenario {
  constructor (nativeConfig, jsConfig, scenarioData) {
    super()
    this.reflectEndpoint = nativeConfig.endpoints.notify.replace('/notify', '/reflect')
    this.statusCode = scenarioData

    const plugin = new BugsnagPluginNetworkInstrumentation({
      maxRequestSize: 1024,
      maxResponseSize: 1024
    })

    jsConfig.plugins = jsConfig.plugins || []
    jsConfig.plugins.push(plugin)
  }

  run () {
    const url = new URL(this.reflectEndpoint)
    url.searchParams.append('status', this.statusCode)
    fetch(url).catch((err) => {
      Bugsnag.notify(err)
    })
  }
}
