import Scenario from './Scenario'
import { NativeModules } from 'react-native'
import Bugsnag from '@bugsnag/react-native'

export class BreadcrumbsAutomaticErrorScenario extends Scenario {
  constructor(configuration, extraData, jsConfig) {
    super()
  }
  run() {
    Bugsnag.notify(new Error('BreadcrumbsAutomaticErrorScenarioA'), () => {}, () => {
      Bugsnag.notify(new Error('BreadcrumbsAutomaticErrorScenarioB'))
    })
  }
}
