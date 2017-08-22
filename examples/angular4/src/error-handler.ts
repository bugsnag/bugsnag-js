/// <reference path="../../../src/bugsnag.d.ts" />

import { ErrorHandler } from '@angular/core';

export class BugsnagErrorHandler implements ErrorHandler {
  handleError(error: any) {
    Bugsnag.notifyException(error, {
      angular: !error.ngDebugContext
        ? undefined
        : { component: error.ngDebugContext.component, context: error.ngDebugContext.context }
    })
    console.error(error)
  }
}
