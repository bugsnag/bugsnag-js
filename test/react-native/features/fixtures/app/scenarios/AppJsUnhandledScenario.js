import Scenario from "./Scenario";
import Bugsnag from '@bugsnag/react-native';

export default class AppJsHandledScenario extends Scenario {
    constructor(configuration, extraData) {
        super(configuration, extraData)
        configuration.appVersion = '1.2.3'
    }
    run() {
        throw new Error("UnhandledError")
    }
}
