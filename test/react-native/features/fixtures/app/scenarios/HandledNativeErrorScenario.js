import Scenario from "./Scenario";
import { NativeModules } from "react-native";

export default class HandledNativeErrorScenario extends Scenario {
    run() {
        NativeModules.BugsnagTestInterface.runScenario("HandledExceptionScenario", () => {})
    }
}