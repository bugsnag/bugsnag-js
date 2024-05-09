import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class BreadcrumbsAutomaticLoadedScenario extends Scenario {
  run () {
    Bugsnag.notify(new Error('BreadcrumbsAutomaticLoadedScenario'))
  }
}
