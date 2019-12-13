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

    const event = this.bugsnagClient.BugsnagEvent.create(
      error,
      true,
      handledState,
      'angular error handler',
      1
    );

    if (error.ngDebugContext) {
      event.addMetadata("angular", {
        component: error.ngDebugContext.component,
        context: error.ngDebugContext.context,
      });
    }

    this.bugsnagClient._notify(event);
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
