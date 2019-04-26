import { Component } from '@angular/core';
import bugsnagClient from './bugsnag';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'app';
  yes = false;
  ngOnInit() {
    setTimeout(() => {
      this.yes = true
    }, 1)
    // unset it immediately so we don't allow two renders – getting multiple errors/reports
    setTimeout(() => {
      this.yes = false
    }, 1)
  }
}
