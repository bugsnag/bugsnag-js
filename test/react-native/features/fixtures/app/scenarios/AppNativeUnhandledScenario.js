import Scenario from "./Scenario";
import { NativeModules } from "react-native";

export default class HandledNativeErrorScenario extends Scenario {
    constructor(configuration, extraData) {
        super(configuration, extraData)
        configuration.appVersion = '1.2.3'
    }
    run() {
        NativeModules.BugsnagTestInterface.runScenario("AppNativeUnhandledScenario", () => {})
    }
}
