# @bugsnag/plugin-console-breadcrumbs

This plugin adds the ability to record console method calls as breadcrumbs by monkey patching them. It defines a configuration option `consoleBreadcrumbsEnabled` which can be used to disable the functionality. It is included in the browser notifier.

**Note:** enabling this plugin means that the line/col origin of console logs appear to come from within Bugsnag's code, so it is not recommended for use in dev environments.

## License
MIT
