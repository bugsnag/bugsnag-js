import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import Bugsnag from '@bugsnag/js';
import { BugsnagErrorHandler } from '@bugsnag/plugin-angular';

Bugsnag.start('YOUR_API_KEY');

export function bugsnagErrorHandlerFactory() {
  return new BugsnagErrorHandler();
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  providers: [{ provide: BugsnagErrorHandler, useFactory: bugsnagErrorHandlerFactory }]
})
export class AppComponent {
  title = 'angular-v18';
}
