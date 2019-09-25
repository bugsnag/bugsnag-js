import Scenario from "./Scenario";

export default class UnhandledErrorScenario extends Scenario {
    run(bugsnagClient) {
        throw new Error('UnhandledError')
    }
}