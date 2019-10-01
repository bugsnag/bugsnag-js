import Scenario from "./Scenario";

export default class HandledCaughtErrorScenario extends Scenario {
    run(bugsnagClient) {
        try {
            throw new Error("HandledCaughtError")
        } catch (e) {
            bugsnagClient.notify(e)
        }
    }
}