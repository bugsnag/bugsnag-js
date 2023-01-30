import Scenario from './Scenario'

export class UnhandledJsErrorScenario extends Scenario {
  run () {
    throw new Error('UnhandledJsErrorScenario')
  }
}
