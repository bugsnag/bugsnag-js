import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class BreadcrumbsJsManualScenario extends Scenario {
  run() {
    let metaData = {
      from: 'javascript'
    }
    Bugsnag.leaveBreadcrumb('oh crumbs', metaData)
    Bugsnag.notify(new Error('BreadcrumbsJsManualScenario'))
  }
}
