import { ErrorHandler, Injectable } from "@angular/core";
import { Bugsnag } from "@bugsnag/js";

@Injectable()
export class BugsnagErrorHandler extends ErrorHandler {
  public bugsnagClient: Bugsnag.Client;
  constructor(bugsnagClient: Bugsnag.Client) {
    super();
    this.bugsnagClient = bugsnagClient;
  }

  public handleError(error: any): void {
    const handledState = {
      severity: "error",
      severityReason: { type: "unhandledException" },
      unhandled: true,
    };

    const event = new this.bugsnagClient.BugsnagEvent(
      error.name,
      error.message,
      this.bugsnagClient.BugsnagEvent.getStacktrace(error),
      handledState,
      error,
    );

    if (error.ngDebugContext) {
      event.updateMetaData("angular", {
        component: error.ngDebugContext.component,
        context: error.ngDebugContext.context,
      });
    }

    this.bugsnagClient.notify(event);
    ErrorHandler.prototype.handleError.call(this, error);
  }
}

const plugin: Bugsnag.Plugin = {
  init: (client: Bugsnag.Client): ErrorHandler => {
    return new BugsnagErrorHandler(client);
  },
  name: "Angular",
};

export default plugin;
