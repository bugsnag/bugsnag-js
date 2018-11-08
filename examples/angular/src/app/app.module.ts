import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
// import our Angular plugin
import { BugsnagErrorHandler } from '@bugsnag/plugin-angular';
// import the bugsnag-js client you initialized in bugsnag.ts
import bugsnagClient from './bugsnag';
import { AppComponent } from './app.component';

// There are certain errors within Angular that get caught by its own error handler
// and only logged to the console. These errors will never make it to Bugsnag by
// themselves and so require a little wiring up.
export function errorHandlerFactory() {
  return new BugsnagErrorHandler(bugsnagClient)
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [ { provide: ErrorHandler, useFactory: errorHandlerFactory } ],
  bootstrap: [AppComponent]
})
export class AppModule { }
