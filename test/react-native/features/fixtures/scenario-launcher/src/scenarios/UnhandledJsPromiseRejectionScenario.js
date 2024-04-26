import Scenario from './Scenario'

export class UnhandledJsPromiseRejectionScenario extends Scenario {
  run () {
    Promise.reject(new Error('UnhandledJsPromiseRejectionScenario'))
  }
}
