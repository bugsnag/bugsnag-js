import Scenario from "./Scenario";

export default class UnhandledPromiseRejectionScenario extends Scenario {
    run(bugsnagClient) {
        Promise.reject(new Error("UnhandledPromiseRejectionError"))
    }
}