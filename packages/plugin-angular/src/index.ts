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

    const report = new this.bugsnagClient.BugsnagReport(
      error.name,
      error.message,
      this.bugsnagClient.BugsnagReport.getStacktrace(error),
      handledState,
    );

    if (error.ngDebugContext) {
      report.updateMetaData("angular", {
        component: error.ngDebugContext.component,
        context: error.ngDebugContext.context,
      });
    }

    this.bugsnagClient.notify(report);
    ErrorHandler.prototype.handleError.call(this, error);
  }
}

const plugin: Bugsnag.IPlugin = {
  init: (client: Bugsnag.Client): ErrorHandler => {
    return new BugsnagErrorHandler(client);
  },
  name: "Angular",
};

export default plugin;
