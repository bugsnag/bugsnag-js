import Scenario from "./Scenario";

export default class CallbackOnClientScenario extends Scenario {
    constructor(config, extraData) {
        config.registerBeforeSendCallback((report, error) => {
            report.metadata = {
                ...report.metadata,
                extra: {
                    reason: "CallbackOnClient"
                }
            }
        })
    }

    run(bugsnagClient) {
        bugsnagClient.notify(new Error("CallbackOnClientError"))
    }
}