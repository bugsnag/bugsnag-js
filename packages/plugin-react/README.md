# @bugsnag/plugin-react

[![Documentation](https://img.shields.io/badge/docs-@bugsnag%2Fplugin–react-green.svg)](https://docs.bugsnag.com/platforms/javascript/react/)
[![NPM](https://img.shields.io/npm/v/@bugsnag/plugin-react.svg)](https://npmjs.org/package/@bugsnag/plugin-react)

[![NPM](https://nodei.co/npm/@bugsnag/plugin-react.png?compact=true)](https://npmjs.org/package/@bugsnag/plugin-react)

A [@bugsnag/js](https://github.com/bugsnag/bugsnag-js) plugin for [React](https://reactjs.org/). Learn more about [error reporting for React applications](https://www.bugsnag.com/platforms/react-error-reporting/) with Bugsnag.

This package enables you to integrate Bugsnag's error reporting with React's [error boundaries](https://blog.bugsnag.com/react-16-error-handling/). It creates and configures an `<ErrorBoundary/>` component which will capture and report unhandled errors in your component tree. You either use the `<ErrorBoundary/>` directly, or extend it to provide some fallback UI for your users.

Reported errors will contain useful debugging info from Reacts's internals such as the component name where the error originated, and the component stack.

## Getting started

1. [Create a Bugsnag account](https://www.bugsnag.com)
2. Complete the instructions in the [integration guide](https://docs.bugsnag.com/platforms/javascript/react/)
3. Report handled exceptions using
   [`Bugsnag.notify()`](https://docs.bugsnag.com/platforms/javascript/react/#reporting-handled-errors)
4. Customize your integration using the
   [configuration options](https://docs.bugsnag.com/platforms/javascript/react/configuration-options/)

## Support

* Check out the [documentation](https://docs.bugsnag.com/platforms/javascript/react)
* [Search open and closed issues](https://github.com/bugsnag/bugsnag-js/issues?q=is%3Aissue) for similar problems
* [Report a bug or request a feature](https://github.com/bugsnag/bugsnag-js/issues/new/choose)

## License

This package is free software released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.
