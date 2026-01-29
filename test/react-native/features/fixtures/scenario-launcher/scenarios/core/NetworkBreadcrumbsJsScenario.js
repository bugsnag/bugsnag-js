import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class NetworkBreadcrumbsJsScenario extends Scenario {
  constructor (configuration) {
    super()
    this.reflectEndpoint = configuration.endpoints.notify.replace('/notify', '/reflect')
  }

  run () {
    fetch(this.reflectEndpoint).then(() => {
      Bugsnag.notify(new Error('NetworkBreadcrumbsJsScenario'))
    })
  }
}
