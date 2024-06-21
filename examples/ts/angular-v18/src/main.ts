import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

throw new Error('This is a test error');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
