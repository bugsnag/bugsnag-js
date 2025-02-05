<div align="center">
  <a href="https://www.bugsnag.com/platforms/javascript">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://assets.smartbear.com/m/3dab7e6cf880aa2b/original/BugSnag-Repository-Header-Dark.svg">
      <img alt="SmartBear BugSnag logo" src="https://assets.smartbear.com/m/3945e02cdc983893/original/BugSnag-Repository-Header-Light.svg">
    </picture>
  </a>
  <h1>Bugsnag error monitoring & reporting for JavaScript</h1>
</div>

[![Documentation](https://img.shields.io/badge/documentation-latest-blue.svg)](https://docs.bugsnag.com/platforms/javascript/)
[![Build status](https://badge.buildkite.com/3d7b170ff1190e95999586fb4e2c67edfbe70484a5c0ecfa70.svg)](https://buildkite.com/bugsnag/bugsnag-js)

Automatically detect JavaScript errors in the browser, Node.js and React Native, with plugins for React, Vue, Angular, Express, Restify and Koa. Get cross-platform error detection for handled and unhandled errors with real-time error alerts and detailed diagnostic reports.

Learn more about [JavaScript error reporting](https://www.bugsnag.com/platforms/javascript/) and [React Native error reporting](https://www.bugsnag.com/platforms/react-native-error-reporting/) from Bugsnag.

---

This is a monorepo (managed with [Lerna](https://lerna.js.org/) containing our universal error reporting client [`@bugsnag/js`](/packages/js), and our React Native client [`@bugsnag/react-native`](/packages/react-native), along with:

- the core Bugsnag libraries for reporting errors ([`@bugsnag/core`](/packages/core))
- plugins for supporting various frameworks (e.g. [`@bugsnag/plugin-react`](/packages/plugin-react))
- plugins for internal functionality (e.g. [`@bugsnag/plugin-simple-throttle`](/packages/plugin-simple-throttle))

Etc. See [packages](/packages) for a full list of contents.

## Getting started

1. [Create a Bugsnag account](https://www.bugsnag.com)
2. Complete the instructions in the [integration guide](https://docs.bugsnag.com/platforms/javascript/)
3. Report handled exceptions using
   [`Bugsnag.notify()`](https://docs.bugsnag.com/platforms/javascript/#reporting-handled-exceptions)
4. Customize your integration using the
   [configuration options](https://docs.bugsnag.com/platforms/javascript/configuration-options/)

## Integrating with frameworks

Use the following plugins and guides to integrate Bugsnag with various frameworks.

### Browser

| Framework  | Bugsnag plugin | Documentation |
| ---------- | -------------- | --------------|
| Vue | [@bugsnag/plugin-vue](packages/plugin-vue) | [Vue docs](https://docs.bugsnag.com/platforms/javascript/vue)
| React | [@bugsnag/plugin-react](packages/plugin-react) | [React docs](https://docs.bugsnag.com/platforms/javascript/react)
| Angular | [@bugsnag/plugin-angular](packages/plugin-angular) | [Angular docs](https://docs.bugsnag.com/platforms/javascript/angular)

### Desktop

| Framework  | Bugsnag notifier | Documentation |
| ---------- | ---------------- | --------------|
| Electron   | [@bugsnag/electron](packages/electron) | [Electron docs](https://docs.bugsnag.com/platforms/electron) |

### Server

| Framework  | Bugsnag plugin | Documentation |
| ---------- | -------------- | --------------|
| Koa | [@bugsnag/plugin-koa](packages/plugin-koa)  | [Koa docs](https://docs.bugsnag.com/platforms/javascript/koa) |
| Express | [@bugsnag/plugin-express](packages/plugin-express)  | [Express docs](https://docs.bugsnag.com/platforms/javascript/express) |
| Restify | [@bugsnag/plugin-restify](packages/plugin-restify)  | [Restify docs](https://docs.bugsnag.com/platforms/javascript/restify) |

### Mobile

| Framework  | Bugsnag notifier | Documentation |
| ---------- | -------------- | --------------|
| React Native | [@bugsnag/react-native](packages/react-native) | [React Native docs](https://docs.bugsnag.com/platforms/react-native/react-native/) |

## Support

* Check out the [FAQ](https://docs.bugsnag.com/platforms/javascript/faq) and [configuration options](https://docs.bugsnag.com/platforms/javascript/configuration-options)
* [Search open and closed issues](https://github.com/bugsnag/bugsnag-js/issues?q=+) for similar problems
* [Report a bug or request a feature](https://github.com/bugsnag/bugsnag-js/issues/new/choose)

## Contributing

Most updates to this repo will be made by Bugsnag employees. We are unable to accommodate significant external PRs such as features additions or any large refactoring, however minor fixes are welcome. See [contributing](CONTRIBUTING.md) for more information.

## Development quick start

```sh
# Clone the repository
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js

# Install top-level dependencies
npm i

# Build the standalone notifiers and plugins
npm run build

# Run the unit tests
npm run test:unit

# Run tests for a specific package
npm run test:unit -- --testPathPattern="packages/react-native"

# Generate a code coverage report
npm run test:unit -- --coverage

# Run the linter
npm run test:lint

# Run the typescript compatibility tests
npm run test:types
```

See [contributing](CONTRIBUTING.md) for more information.

## License

All packages in this repository are released under the MIT License. See [LICENSE.txt](./LICENSE.txt) for details.
