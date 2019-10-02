import Scenario from "./Scenario";

export default class AppDefaultScenario extends Scenario {
    run(bugsnagClient) {
        bugsnagClient.notify(new Error("AppDefaultError"))
    }
}