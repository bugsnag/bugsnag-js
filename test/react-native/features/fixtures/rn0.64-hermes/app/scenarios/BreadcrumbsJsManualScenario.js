import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class BreadcrumbsJsManualScenario extends Scenario {
  run () {
    const metaData = {
      from: 'javascript'
    }
    Bugsnag.leaveBreadcrumb('oh crumbs', metaData, 'state')
    Bugsnag.notify(new Error('BreadcrumbsJsManualScenario'))
  }
}
