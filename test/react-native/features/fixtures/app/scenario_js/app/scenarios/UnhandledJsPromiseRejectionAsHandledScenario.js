import Scenario from './Scenario'

export class UnhandledJsPromiseRejectionAsHandledScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    jsConfig.reportUnhandledPromiseRejectionsAsHandled = true
  }

  run () {
    Promise.reject(new Error('UnhandledJsPromiseRejectionAsHandledScenario'))
  }
}
