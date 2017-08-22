import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BugsnagErrorHandler } from '../error-handler'

import { AppComponent } from './app.component';

@NgModule({
  imports: [ BrowserModule ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ],
  providers: [ { provide: ErrorHandler, useClass: BugsnagErrorHandler } ]
})

export class AppModule { }
