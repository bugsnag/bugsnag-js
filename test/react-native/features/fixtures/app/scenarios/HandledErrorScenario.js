import Scenario from "./Scenario";

export default class HandledErrorScenario extends Scenario {
    run(bugsnagClient) {
        bugsnagClient.notify("HandledError")
    }
}