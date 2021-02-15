# @bugsnag/plugin-angular

A [@bugsnag/js](https://github.com/bugsnag/bugsnag-js) integration for [Angular](https://angular.io/).

This package enables you to integrate Bugsnag's error reporting with an Angular (v2+) application at a detailed level. It provides an implementation of the `@angular/core` `ErrorHandler` which you can use to capture and report unhandled errors in your app.

Reported errors will contain useful debugging info from Angular's internals, such as the component and context.

## Getting started

1. [Create a Bugsnag account](https://www.bugsnag.com)
2. Complete the instructions in the [integration guide](https://docs.bugsnag.com/platforms/javascript/angular/)
3. Report handled exceptions using
   [`Bugsnag.notify()`](https://docs.bugsnag.com/platforms/javascript/angular/#reporting-handled-errors)
4. Customize your integration using the
   [configuration options](https://docs.bugsnag.com/platforms/javascript/angular/configuration-options/)

## Support

* Check out the [documentation](https://docs.bugsnag.com/platforms/javascript/angular/)
* [Search open and closed issues](https://github.com/bugsnag/bugsnag-js/issues?q=is%3Aissue) for similar problems
* [Report a bug or request a feature](https://github.com/bugsnag/bugsnag-js/issues/new/choose)

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.
