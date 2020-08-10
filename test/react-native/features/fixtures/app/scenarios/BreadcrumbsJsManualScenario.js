import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class BreadcrumbsJsManualScenario extends Scenario {
  run() {
    Bugsnag.leaveBreadcrumb('oh crumbs')
    Bugsnag.notify(new Error('BreadcrumbsJsManualScenario'))
  }
}
