import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class BreadcrumbsAutomaticErrorScenario extends Scenario {
  run () {
    Bugsnag.notify(new Error('BreadcrumbsAutomaticErrorScenarioA'), () => {
    }, () => {
      setTimeout(() => Bugsnag.notify(new Error('BreadcrumbsAutomaticErrorScenarioB')), 2000)
    })
  }
}
