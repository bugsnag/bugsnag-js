import Scenario from "./Scenario";

export default class UnhandledErrorScenario extends Scenario {
    run() {
        throw new Error('UnhandledError')
    }
}