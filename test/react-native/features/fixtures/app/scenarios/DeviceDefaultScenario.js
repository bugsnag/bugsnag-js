import Scenario from "./Scenario";

export default class DeviceDefaultScenario extends Scenario {
    run(bugsnagClient) {
        bugsnagClient.notify(new Error("DeviceDefaultError"))
    }
}