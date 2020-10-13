import Scenario from './Scenario'

export class ReactNavigationBreadcrumbsDisabledScenario extends Scenario {
  constructor (configuration, extraData, jsConfig) {
    super()
    configuration.enabledBreadcrumbTypes = []
  }
}
