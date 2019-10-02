import Scenario from "./Scenario";

export default class DeviceDefault extends Scenario {
    run(bugsnagClient) {
        bugsnagClient.notify(new Error("DeviceDefaultError"))
    }
}