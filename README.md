<img src="https://user-images.githubusercontent.com/609579/42215465-7223c4a4-7eb6-11e8-8b4c-9d7b30dfeb88.png" alt="Bugsnag logo" width="200"/>

**Universal JavaScript error reporting**

Automatically detect JavaScript errors in the browser and Node.js, with plugins for React, Vue, Angular, Express, Restify and Koa. Get cross-platform error detection for handled and unhandled errors with real-time error alerts and detailed diagnostic reports.

Learn more about [JavaScript error reporting](https://www.bugsnag.com/platforms/javascript/) from Bugsnag.

---

This is a monorepo (managed with [Lerna](https://lernajs.io/)) containing our universal error reporting client: [`@bugsnag/js`](/packages/js), along with:

- the core Bugsnag libraries for reporting errors ([`@bugsnag/core`](/packages/core))
- plugins for supporting various frameworks (e.g. [`@bugsnag/plugin-react`](/packages/plugin-react))
- plugins for internal functionality (e.g. [`@bugsnag/plugin-simple-throttle`](/packages/plugin-simple-throttle))

See [packages](/packages) for a full list of contents.

## Getting started

1. [Create a Bugsnag account](https://www.bugsnag.com)
2. Complete the instructions in the [integration guide](https://docs.bugsnag.com/platforms/javascript/)
3. Report handled exceptions using
   [`bugsnagClient.notify()`](https://docs.bugsnag.com/platforms/javascript/#reporting-handled-exceptions)
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

### Server

| Framework  | Bugsnag plugin | Documentation |
| ---------- | -------------- | --------------|
| Koa | [@bugsnag/plugin-koa](packages/plugin-koa)  | [Koa docs](https://docs.bugsnag.com/platforms/javascript/koa) |
| Express | [@bugsnag/plugin-express](packages/plugin-express)  | [Express docs](https://docs.bugsnag.com/platforms/javascript/express) |
| Restify | [@bugsnag/plugin-restify](packages/plugin-restify)  | [Restify docs](https://docs.bugsnag.com/platforms/javascript/restify) |

## Support

* Check out the [FAQ](https://docs.bugsnag.com/platforms/javascript/faq) and [configuration options](https://docs.bugsnag.com/platforms/javascript/configuration-options)
* [Search open and closed issues](https://github.com/bugsnag/bugsnag-js/issues?q=+) for similar problems
* [Report a bug or request a feature](https://github.com/bugsnag/bugsnag-js/issues/new)

## Contributing

Most updates to this repo will be made by Bugsnag employees. We are unable to accommodate significant external PRs such as features additions or any large refactoring, however minor fixes are welcome. See [contributing](CONTRIBUTING.md) for more information.

## Development quick start

```sh
git clone git@github.com:bugsnag/bugsnag-js.git
cd bugsnag-js
npm i
npx lerna bootstrap
npx lerna run build
cd packages/browser && bundle
cd ../node && bundle
```

See [contributing](CONTRIBUTING.md) for more information.

## License

All packages in this repository are released under the MIT License.
