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
  }
}
