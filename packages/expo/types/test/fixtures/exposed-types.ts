import { Client, NotifiableError, OnErrorCallback } from "../../..";
let bugsnagInstance: Client | undefined = undefined;
export function notify(error: NotifiableError, onError?: OnErrorCallback): void {
  if (bugsnagInstance === undefined) {
    return
  }
  return bugsnagInstance.notify(error, onError)
}
