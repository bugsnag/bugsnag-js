# @bugsnag/plugin-network-breadcrumbs

This plugin adds the ability to record browser requests as breadcrumbs by monkey-patching `window.XMLHttpRequest` and `window.fetch`, including HTTP status codes where available. It defines a configuration option `networkBreadcrumbsEnabled` which can be used to disable the functionality. It is included in the browser notifier.

## License
MIT
