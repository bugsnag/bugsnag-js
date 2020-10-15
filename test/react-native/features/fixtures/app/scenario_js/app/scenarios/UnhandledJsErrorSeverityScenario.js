import Scenario from './Scenario'

export class UnhandledJsErrorSeverityScenario extends Scenario {
  constructor (configuration, extraData, jsConfig) {
    super()
    jsConfig.onError = (event) => {
      event.severity = 'info'
    }
  }

  run () {
    throw new Error('UnhandledJsErrorSeverityScenario')
  }
}
