import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class BreadcrumbsNullEnabledBreadcrumbTypesScenario extends Scenario {
  constructor (configuration, extraData, jsConfig) {
    super()
    configuration.enabledBreadcrumbTypes = null
  }

  run () {
    Bugsnag.notify(
      new Error('BreadcrumbsNullEnabledBreadcrumbTypesScenarioA'),
      () => {},
      () => {
        setTimeout(
          () => Bugsnag.notify(new Error('BreadcrumbsNullEnabledBreadcrumbTypesScenarioB')),
          2000
        )
      }
    )
  }
}
