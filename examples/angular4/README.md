# Bugsnag: Angular 4 Example

This example shows how you can use the Bugsnag JavaScript notifier with
[Angular 4](https://angular.io/).

Whilst the notifier reports any errors that are uncaught, there are certain errors
within Angular that get caught by its own error handler and only logged to the console.
These errors will never make it to Bugsnag by themselves and so require a little
wiring up.

The example shown here illustrates how to provide a custom `ErrorHandler` class
which notifies Bugsnag of the errors as well as logging them to the console.

## tl;dr

The most basic way to hook up Angular 4 -> Bugsnag is as follows:

#### `error-handler.ts`

Implement an `ErrorHandler` class:

```typescript
/// <reference path="path/to/typings/bugsnag.d.ts" />

import { ErrorHandler } from '@angular/core';

export class BugsnagErrorHandler implements ErrorHandler {
  handleError(error: any) {
    Bugsnag.notifyException(error)
  }
}
```

#### `app.module.ts`

Provide the custom `ErrorHandler` class to the top-level `@NgModule`:

```typescript
import { NgModule, ErrorHandler } from '@angular/core';
import { BugsnagErrorHandler } from '../error-handler'
…
@NgModule({
  …
  providers:    [ { provide: ErrorHandler, useClass: BugsnagErrorHandler } ]
  …
})
```

Check out the [detailed example](src/error-handler.ts) for how to provide extra Angular
debugging context.

## In this example

- [Implementing the `ErrorHandler`](src/error-handler.ts)

  The most basic implementation (above) can be supplemented by providing some other
  information which may come in handy when tracking down the source of the error.
  Angular decorates the `Error` object with some addition debugging info, which may
  be available:
    - `ngDebugContext.component`
    - `ngDebugContext.context`

  There may be other properties of the [`ngDebugContext`](https://github.com/angular/angular/blob/32ff21c16bf1833d2da9f8e2ec8536f7a13f92de/packages/core/src/view/types.ts#L481-L492)
  object passed to the error handler that you are interested in – you can tweak
  the example to your needs and it will show in the "Angular" tab when viewing
  event details in your dashboard.

- [Providing the `ErrorHandler` to the Angular app](src/app/app.module.ts#L11)

  In order to get Angular to use the `ErrorHandler` you implemented, it needs to
  be set as a provider – such that any time a child component/directive/service
  expect an `ErrorHandler` to be provided, they get yours rather than the default.

- [Handling render errors](src/app/app.component.js#L6-L7)

  Errors thrown during the render of a component are caught and reported (in this
  case attempting to interpolate a property of something that is `undefined`).

## Setup

Try this out with [your own Bugsnag account](https://app.bugsnag.com/user/new)!
You'll be able to see how the errors are reported in the dashboard, how breadcrumbs
are left, how errors are grouped and how they relate to the original source.

To get set up, follow the instructions below. Don't forget to replace the placeholder
API token with your own!

1. Clone the repo and `cd` this this directory:
    ```sh
    git clone git@github.com:bugsnag/bugsnag-js.git
    cd examples/angular4
    ```
1. Install the dependencies (with either npm or yarn):
    ```sh
    npm i
    ```
    ```sh
    yarn
    ```
1. Replace the `API-KEY-GOES-HERE` placeholder in [index.html](index.html) with your actual API key.
1. Start a web server and run the typescript compiler:
    ```sh
    npm start
    ```
1. View the example page which will (most likely) be served at: http://localhost:5000/examples/angular4
