# Bugsnag error monitoring & reporting for Electron

Automatically detect JavaScript errors and native crashes. Get cross-platform error detection for handled and unhandled errors with real-time error alerts and detailed diagnostic reports.

---

This is a monorepo (managed with [Lerna](https://lernajs.io/)) containing our error reporting client [`@bugsnag/electron`](/packages/electron) and plugins for internal functionality.

See [packages](/packages) for a full list of contents.

## Getting started

1. [Create a Bugsnag account](https://www.bugsnag.com)
2. Complete the instructions in the [integration guide](https://docs.bugsnag.com/platforms/electron/)
3. Report handled exceptions using
   [`Bugsnag.notify()`](https://docs.bugsnag.com/platforms/electron/#reporting-handled-exceptions)
4. Customize your integration using the
   [configuration options](https://docs.bugsnag.com/platforms/electron/configuration-options/)

## Support

* Check out the [configuration options](https://docs.bugsnag.com/platforms/electron/configuration-options)
* [Search open and closed issues](https://github.com/bugsnag/bugsnag-electron/issues?q=+) for similar problems
* [Report a bug or request a feature](https://github.com/bugsnag/bugsnag-electron/issues/new)

## Contributing

Most updates to this repo will be made by Bugsnag employees. We are unable to accommodate significant external PRs such as features additions or any large refactoring, however minor fixes are welcome. See [contributing](CONTRIBUTING.md) for more information.

## Development quick start

```sh
# Clone the repository
git clone git@github.com:bugsnag/bugsnag-electron.git
cd bugsnag-electron

# Install top-level dependencies
npm install

# Bootstrap all of the packages
npm run bootstrap

# Run the unit tests
npm run test:unit
```

See [contributing](CONTRIBUTING.md) for more information.

## License

All packages in this repository are released under the MIT License.
