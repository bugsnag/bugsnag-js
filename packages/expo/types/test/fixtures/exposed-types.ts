import { Client, AbstractTypes } from "../../..";
let bugsnagInstance: Client | undefined = undefined;
export function notify(error: AbstractTypes.NotifiableError, cb?: AbstractTypes.OnErrorCallback): void {
  if (bugsnagInstance === undefined) {
    return
  }
  return bugsnagInstance.notify(error, cb)
}
