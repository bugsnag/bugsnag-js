import { Bugsnag } from "../../..";
let bugsnagInstance: Bugsnag.Client | undefined = undefined;
export function notify(error: Bugsnag.NotifiableError, opts?: Bugsnag.INotifyOpts): void {
  if (bugsnagInstance === undefined) {
    return
  }
  return bugsnagInstance.notify(error, opts)
}
