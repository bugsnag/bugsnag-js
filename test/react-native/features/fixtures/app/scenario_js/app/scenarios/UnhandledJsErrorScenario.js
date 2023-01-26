import Scenario from './Scenario'

export class UnhandledJsErrorScenario extends Scenario {
  constructor (configuration, jsConfig) {
    super()
    function log (...msg) {
      console.log(...msg)
    }
    configuration.logger = { debug: log, info: log, warn: log, error: log }
    console.log('I have created the UnhandledJsErrorScenario ---------------------------------------------------------')
  }

  run () {
    console.log('UnhandledJsErrorScenario is about to crash! ---------------------------------------------------------')
    throw new Error('UnhandledJsErrorScenario')
  }
}
