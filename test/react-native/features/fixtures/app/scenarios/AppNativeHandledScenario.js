import Scenario from "./Scenario";
import { NativeModules } from "react-native";

export default class HandledNativeErrorScenario extends Scenario {
    constructor(configuration, extraData, jsConfig) {
        super()
        configuration.appVersion = '1.2.3'
        jsConfig.codeBundleId = '1.2.3-r00110011'
    }
    run() {
        NativeModules.BugsnagTestInterface.runScenario("AppNativeHandledScenario", () => {})
    }
}
