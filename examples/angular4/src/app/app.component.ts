import { Component } from '@angular/core';

@Component({
  selector: 'app',
  template: `
    <button (click)="triggerRenderError()">Trigger a render error</button>
    <div *ngIf="doARenderError">{{ doARenderError.non.existent.property }}</div>
  `,
})

export class AppComponent  {
  doARenderError = false;

  triggerRenderError() {
    this.doARenderError = true
    setTimeout(function () {
      this.doARenderError = false
    }.bind(this), 100)
  }
}
