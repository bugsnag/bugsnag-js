import Scenario from "./Scenario";
import Bugsnag from '@bugsnag/react-native';

export default class HandledCaughtErrorScenario extends Scenario {
    run() {
        try {
            throw new Error("HandledCaughtError")
        } catch (e) {
            Bugsnag.notify(e)
        }
    }
}