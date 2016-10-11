Changelog
=========

3.0.6 (2016-10-11)
-----

### Enhancements

- You can now call `Bugsnag.notify()` and `Bugsnag.notifyException()` with no
  arguments. This will show up in the dashboard as "BugsnagNotify". (#197)

### Changes

- New methods enabling disabling automatic breadcrumbs (#199). The old
  configuration options (e.g. `Bugsnag.autoBreadcrumbsConsole = false`) were
  broken. They should no longer be used and are now deprecated. Use instead the
  new methods (e.g. `Bugsnag.enableAutoBreadcrumbsConsole(); Bugsnag.disableAutoBreadcrumbsConsole();`)

### Bug fixes

- `npm run test:watch` now correctly reloads changes in the test file. (#198)

3.0.5 (2016-10-05)
-----

- Limit maximum number of breadcrumbs to 20 (#194)
- Show value of submit inputs & buttons in breadcrumbs (#184, #187)
  [Anton Pawlik](https://github.com/antpaw)
  [#184](https://github.com/bugsnag/bugsnag-js/pull/184)
  [#187](https://github.com/bugsnag/bugsnag-js/pull/187)
- Linter improvements (#180)

3.0.4 (2016-09-09)
-----

- Create "Bugsnag loaded" breadcrumb [#179](https://github.com/bugsnag/bugsnag-js/pull/179)

3.0.3 (2016-09-08)
-----

- Added void return type (#178)
  [Ole Martin Handeland](https://github.com/olemartinorg)
  [#178](https://github.com/bugsnag/bugsnag-js/pull/178)
- Improve notifyException definition (#175)
  [Delisa Mason](https://github.com/kattrali)
  [#175](https://github.com/bugsnag/bugsnag-js/pull/175)

3.0.1 (2016-08-08)
-----

Minor README changes.

3.0.0 (2016-08-05)
-----

This release adds support for automatic and custom breadcrumb tracking.
Breadcrumbs replace the private implementation of "last event" tracking.
It also removes support for the deprecated `userId` setting, which has been
replaced by the `user` object.

### Enhancements

- Add support for sending "breadcrumbs" - notable events leading up to an error
  [Christian Schlensker](https://github.com/wordofchristian)
  [#149](https://github.com/bugsnag/bugsnag-js/pull/149)
- Send device time in error payload
  [#165](https://github.com/bugsnag/bugsnag-js/pull/165)


2.5.0 (2016-01-29)
-----

### Bug Fixes

- Clean up undefined property in window object when using `Bugsnag.noConflict()`
  [Jacob Marshall](https://github.com/jacobmarshall)
  [#115](https://github.com/bugsnag/bugsnag-js/issues/115)
  [#116](https://github.com/bugsnag/bugsnag-js/pull/116)

### Enhancements

- Support XHR notify handlers
  [Dimitar Tnokovski](https://github.com/tnokovski)
  [#123](https://github.com/bugsnag/bugsnag-js/issues/123)
  [#124](https://github.com/bugsnag/bugsnag-js/pull/124)


2.4.9 (2015-12-10)
-----

### Bug Fixes

- Fix an issue where null exceptions throw an error
  [Rick Harrison](https://github.com/rickharrison)
  [#110](https://github.com/bugsnag/bugsnag-js/pull/110)

### Enhancements

- Add configuration option for `maxDepth`
  [Jacob Marshall](https://github.com/jacobmarshall)
  [#114](https://github.com/bugsnag/bugsnag-js/pull/114)

2.4.8
-----

-  Fix a permissions bug in Firefox extensions like Selenium
   that trigger page events from native code.

2.4.7
-----
-  Fix a bug when Bugsnag is loaded with no script tags
-  First version available on npm as bugsnag-js

2.4.6
-----
-  Don't crash while serializing DOM nodes

2.4.5
-----
-  Fix a conflict with some AMD loaders

2.4.4
-----
-  Fix an infinite loop in some cases.

2.4.3
-----
-  Fix requestAnimationFrame polyfill.

2.4.2
-----
-   Better support for method names on old IEs

2.4.1
-----
-   Make common-js loading less eager

2.4.0
-----
-   Add support for UMD/common-js loaders.
-   Add support for refreshing client-side rate-limit.
-   Add a warning about cross domain script errors.

2.3.6
-----
-   Ensure `beforeNotify` can access/modify the entire payload, allows for full
    control of what data is sent to Bugsnag

2.3.5
-----
-   Support for bower.json
-   Fix issue caused by loading bugsnag asyncily
-   Support for full backtraces in setImmediate functions

2.3.4
-----
-   Fix issue with passing metadata to notifyException using metadata as name

2.3.3
-----
-   Prepare 'severity' feature for release

2.3.2
-----
-   Limit the number of exceptions per page load

2.3.1
-----
-   Allow redacting script contents

2.3.0
-----
-   Allow setting `Bugsnag.user`
-   Remove sourcemaps comment for now (it breaks Safari developer console)

2.2.1
-----
-   Don't send duplicate exceptions from the client

2.2.0
-----
-   Fix window.setTimeout with a string (broken by 2.1.0)
-   Use the first parameter of .notify() for grouping
-   Fix persistent metaData merging

2.1.1
-----
-   Track document.currentScript across async boundaries.

2.1.0
-----
-   Fix additional parameters to window.setTimeout etc.

2.0.2
-----
-   Remove accidentally exposed function.

2.0.1
-----
-   Don't crash with selenium.

2.0.0
-----
-   Better grouping support.

1.1.0
-----
-   Add support for stacktraces on all modern browsers.
-   Add support for tracking most recent event fired.

1.0.10
------
-   Add support for sending column numbers and error objects from `window.onerror` in modern browsers
-   Add a `beforeNotify` callback to allow filtering of errors being sent to Bugsnag

1.0.9
-----
-   Fixed bug with reading the `data-autonotify` setting

1.0.8
-----
-   Add `autoNotify` setting to disable `window.onerror` notification

1.0.7
-----
-   Add support for setting a custom userId

1.0.6
-----
-   Add support for metrics tracking (optional)

1.0.5
-----
-   Add support for `notifyReleaseStages`, a whitelist for which releaseStages
    should notify Bugsnag

1.0.4
-----
-   Allow the setting of custom error names on notifyException

1.0.3
-----
-   Added stacktrace approximation for browsers that don't support stacktraces
-   Added a cachebreaker to http requests

1.0.2
-----
-   Use image tag instead of script tag to make requests, for better
    cross-browser support

1.0.1
-----
-   Fixed metaData serialization bug
-   Added test suite

1.0.0
-----
-   First public release
