import Scenario from "./Scenario";

export default class UnhandledPromiseRejectionScenario extends Scenario {
    run(bugsnagClient) {
        new Promise((resolve, reject) => {
            setTimeout(() => {
                reject("UnhandledPromiseRejection")
            })
        })
    }
}