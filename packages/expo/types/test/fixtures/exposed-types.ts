import { Bugsnag } from "../../..";
let bugsnagInstance: Bugsnag.Client | undefined = undefined;
export function notify(error: Bugsnag.NotifiableError, opts?: Bugsnag.NotifyOpts): void {
  if (bugsnagInstance === undefined) {
    return
  }
  return bugsnagInstance.notify(error, opts)
}
