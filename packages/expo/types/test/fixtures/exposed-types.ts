import { Bugsnag } from "../../..";
let bugsnagInstance: Bugsnag.Client | undefined = undefined;
export function notify(error: Bugsnag.NotifiableError, beforeSend?: Bugsnag.BeforeSend): void {
  if (bugsnagInstance === undefined) {
    return
  }
  return bugsnagInstance.notify(error, beforeSend)
}
