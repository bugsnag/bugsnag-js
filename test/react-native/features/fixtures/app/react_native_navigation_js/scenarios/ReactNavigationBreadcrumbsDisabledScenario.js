import Scenario from './Scenario'

export class ReactNavigationBreadcrumbsDisabledScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    configuration.enabledBreadcrumbTypes = []
  }
}
