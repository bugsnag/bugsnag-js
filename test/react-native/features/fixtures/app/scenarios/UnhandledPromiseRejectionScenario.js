import Scenario from "./Scenario";

export default class UnhandledPromiseRejectionScenario extends Scenario {
    run() {
        Promise.reject(new Error("UnhandledPromiseRejection"))
    }
}