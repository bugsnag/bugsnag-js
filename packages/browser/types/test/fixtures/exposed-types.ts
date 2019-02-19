import { Bugsnag } from "../../..";
let bugsnagInstance: Bugsnag.Client | undefined = undefined;
export function notify(error: Bugsnag.NotifiableError, opts?: Bugsnag.INotifyOpts): boolean {
  if (bugsnagInstance === undefined) {
    return false
  }
  return bugsnagInstance.notify(error, opts)
}
