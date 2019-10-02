import Scenario from "./Scenario";

export default class CallbackOnNotifyScenario extends Scenario {
    run(bugsnagClient) {
        bugsnagClient.notify(new Error("CallbackOnNotifyError"), report => {
            report.metadata = {
                ...report.metadata,
                extra: {
                    reason: "CallbackOnNotify"
                }
            }
        })
    }
}