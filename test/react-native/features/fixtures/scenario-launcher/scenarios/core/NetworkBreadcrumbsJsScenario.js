import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class NetworkBreadcrumbsJsScenario extends Scenario {
  constructor (nativeConfig, jsConfig, scenarioData) {
    super()
    this.reflectEndpoint = nativeConfig.endpoints.notify.replace('/notify', '/reflect')
  }

  run () {
    fetch(this.reflectEndpoint).then(() => {
      Bugsnag.notify(new Error('NetworkBreadcrumbsJsScenario'))
    })
  }
}
