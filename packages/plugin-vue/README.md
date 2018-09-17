# @bugsnag/plugin-vue

[![NPM](https://img.shields.io/npm/v/@bugsnag/plugin-vue.svg)](https://npmjs.org/package/@bugsnag/plugin-vue)

A [bugsnag-js](https://github.com/bugsnag/bugsnag-js) plugin for [Vue.js](https://vuejs.org/).

This package enables you to integrate Bugsnag's error reporting with a Vue.js application at a detailed level. It creates and configures a Vue `ErrorHandler` which will capture and report unhandled errors in your app.

Reported errors will contain useful debugging info from Vue's internals, such as the component name, props and any other context that Vue can provide.

## Installation

```sh
npm i --save bugsnag-js @bugsnag/plugin-vue
# or
yarn add bugsnag-js @bugsnag/plugin-vue
```

## Usage

```js
const Vue = require('vue')
const bugsnag = require('@bugsnag/js')
const bugsnagVue = require('@bugsnag/plugin-vue')

const bugsnagClient = bugsnag('API_KEY')
bugsnagClient.use(bugsnagVue, Vue)
```

## Support

* Check out the [documentation](https://docs.bugsnag.com/platforms/javascript/vue/)
* [Search open and closed issues](https://github.com/bugsnag/bugsnag/js/issues?q=is%3Aissue) for similar problems
* [Report a bug or request a feature](https://github.com/bugsnag/bugsnag/js/issues/new)

## License

The Bugsnag JS library and official plugins are free software released under the MIT License. See [LICENSE.txt](LICENSE.txt) for details.
