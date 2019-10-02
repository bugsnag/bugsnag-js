import Scenario from "./Scenario";

export default class UserCallbackScenario extends Scenario {
    constructor(config, extraData) {
        config.registerBeforeSendCallback((report, error) => {
            report.user = {
                id: "1234",
                name: "UserCallback"
            }
        })
    }

    run(bugsnagClient) {
        bugsnagClient.notify(new Error("UserCallbackError"))
    }
}