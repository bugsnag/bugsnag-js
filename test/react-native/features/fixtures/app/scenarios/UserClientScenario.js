import Scenario from "./Scenario";

export default class UserClientScenario extends Scenario {
    run(bugsnagClient) {
        bugsnagClient.setUser('1234', 'UserClient')
        bugsnagClient.notify(new Error("UserClientError"))
    }
}