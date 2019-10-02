import Scenario from "./Scenario";

export default class IgnoredReportScenario extends Scenario {
    constructor(config, extraData) {
        config.registerBeforeSendCallback((report, error) => {
            return false
        })
    }

    run(bugsnagClient) {
        bugsnagClient.notify(new Error("IgnoredReportError"))
    }
}