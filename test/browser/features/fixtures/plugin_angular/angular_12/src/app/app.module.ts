import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BugsnagErrorHandler } from '@bugsnag/plugin-angular';
import bugsnagClient from './bugsnag';

export function errorHandlerFactory() {
  return new BugsnagErrorHandler(bugsnagClient);
}

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [{ provide: ErrorHandler, useFactory: errorHandlerFactory }],
  bootstrap: [AppComponent]
})
export class AppModule { }
