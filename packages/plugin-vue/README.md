# @bugsnag/plugin-vue

[![NPM](https://img.shields.io/npm/v/@bugsnag/plugin-vue.svg)](https://npmjs.org/package/@bugsnag/plugin-vue)

A [bugsnag-js](https://github.com/bugsnag/bugsnag-js) plugin for [Vue.js](https://vuejs.org/).

This package enables you to integrate Bugsnag's error reporting with a Vue.js application at a detailed level. It creates and configures a Vue `ErrorHandler` which will capture and report unhandled errors in your app.

Reported errors will contain useful debugging info from Vue's internals, such as the component name, props and any other context that Vue can provide.

## Getting started

1. [Create a Bugsnag account](https://www.bugsnag.com)
2. Complete the instructions in the [integration guide](https://docs.bugsnag.com/platforms/javascript/vue/)
3. Report handled exceptions using
   [`Bugsnag.notify()`](https://docs.bugsnag.com/platforms/javascript/vue/#reporting-handled-errors)
4. Customize your integration using the
   [configuration options](https://docs.bugsnag.com/platforms/javascript/vue/configuration-options/)

## Support

* Check out the [documentation](https://docs.bugsnag.com/platforms/javascript/vue/)
* [Search open and closed issues](https://github.com/bugsnag/bugsnag/js/issues?q=is%3Aissue) for similar problems
* [Report a bug or request a feature](https://github.com/bugsnag/bugsnag/js/issues/new/choose)

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.
