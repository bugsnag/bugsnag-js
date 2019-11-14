# @bugsnag/core

This package contains the core classes and utilities common to the Bugsnag notifier for any JS-based platform:

- `Client` class
- `Event` class
- `Breadcrumb` class
- `Session` class
- `config` scheme and utils
- Basic JS polyfills that don't pollute the global scope (for support back to IE8)
- and a couple of other small utilities

Unless you are writing your own notifier, it is unlikely that you want to install this module – for the universal error reporting client, see [@bugsnag/js](../js).

## License
MIT
