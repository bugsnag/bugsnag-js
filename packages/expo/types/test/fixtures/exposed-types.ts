import { Bugsnag } from "../../..";
let bugsnagInstance: Bugsnag.Client | undefined = undefined;
export function notify(error: Bugsnag.NotifiableError, onError?: Bugsnag.OnError): void {
  if (bugsnagInstance === undefined) {
    return
  }
  return bugsnagInstance.notify(error, onError)
}
