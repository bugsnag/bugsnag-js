# Changelog

<!-- {entry_placeholder} -->

## 4.7.3 (2018-08-01)

### Removed
- Stop sending stacktrace with breadcrumb metadata

### Fixed
- Added missing instance properties to `Breadcrumb` TypeScript definition



## 4.7.2 (2018-06-18)

### Fixed
- Workaround for iOS9 Safari CSP issue which caused bugsnag-js to throw an error (#358, #357)


## 4.7.1 (2018-06-04)

This release fixes a couple of bugs with stacktrace parsing.

### Fixed
- Incorrect parsing of stacktraces for errors in Chrome that have no stackframes (#355)
- Incorrect parsing of stacktraces for errors in Firefox/Safari that have "@" in the URL path (#354) 


## 4.7.0 (2018-05-31)

**Note**: this release alters the behaviour of the notifier to track sessions automatically.

As part of this change, the way in which URLs are configured has been updated:

```diff
- endpoint: 'https://bugsnag-notify.example.com',
- sessionEndpoint: 'https://bugsnag-sessions.example.com',
+ endpoints: {
+  notify: 'https://bugsnag-notify.example.com',
+  sessions: 'https://bugsnag-sessions.example.com'
+ }
```

`endpoints` and `sessionEndpoints` are now deprecated but still supported. Note that session tracking
will be disabled if the notify endpoint is configured but the sessions endpoint is not – this is to
avoid inadvertently sending session payloads to the wrong server.

### Added
- A new end-to-end/black box test suite has been added (#351)

### Changed
- `autoCaptureSessions` default value was `false` and is now true (#341)

### Deprecated
- `endpoint` and `sessionEndpoints` have been deprecated and combined into a single new option: `endpoints` (#341)

### Removed
- The old `e2e` test suite has been removed (#351)



## 4.6.3 (2018-05-10)

### Fixed
- Use the correct network breadcrumb type (`network` -> `request`). Fixes network breadcrumbs not displaying in the dashboard. (#348)


## 4.6.2 (2018-05-08)

The previous version (v4.6.1) was removed from the npm registry and the CDN because of critical issue surrounding history state methods. This release resolves that issue. The release notes for v4.6.1 are included here too for completeness.

### Fixed
- Fix history API url parameter logic (#347)
- Only pass in `url` parameter to history methods when it is not `undefined`. Fixes a bug in IE11 where it converts `undefined` to a string, causing a redirect to `/undefined`. (#342)
- Prevent a crash in IE10 when accessing `history.state`. (#345)


## 4.6.1 (2018-05-03)

A couple of fixes for IE10/11 relating to quirks in their implementation of the history APIs.

### Fixed
- Only pass in `url` parameter to history methods when it is not `undefined`. Fixes a bug in IE11 where it converts `undefined` to a string, causing a redirect to `/undefined`. (#342)
- Prevent a crash in IE10 when accessing `history.state`. (#345)


## 4.6.0 (2018-04-20)

### Added
- It is now possible to customize the logger by setting the `logger` option of the configuration object. A custom logger must have the methods `debug`, `info`, `warn` and `error`. To completely disable logging, set `logger: null`. (#340)

### Fixed
- A custom version of [safe-json-stringify](https://github.com/bugsnag/safe-json-stringify) now fully protects against circular structures returned from toJSON() and arbitrarily wide/deep structures (#338)


## 4.5.0 (2018-04-06)

### Added
- New breadcrumbs! Breadcrumbs are now left when requests are made using XMLHttpRequest (ajax) or fetch(). This works with all request libraries out of the box: jQuery, axios, superagent etc. Metadata includes HTTP method, request url and the status code (if available). By default network breadcrumbs are collected all with other autoBreadcrumb types. If you don't want to collect network breadcrumbs, set `networkBreadcrumbsEnabled: false`. (#334)

### Changed
- As part of #334 [envify](https://github.com/hughsk/envify) was added to compile out plugin "destroy" logic that was only required for tests.


## 4.4.0 (2018-03-15)

### Changed
- Switch from a protocol-relative default for endpoint and sessionEndpoint to "https://". IE8/9 will attempt to send via http if the protocol of the current page is http. Otherwise all requests will now go via https unless configured otherwise (#333).

### Fixed
- Fix rollup bundling issue (switching to a forked version of cuid) (#331)


## 4.3.1 (2018-03-07)

### Changed
- Perf improvements for breadcrumbs, most notably console log methods with lots of data (#329)


## 4.3.0 (2018-02-23)

<!-- optional: if this is a significant release, describe it in a sentence or two -->

### Added
- Stub exported types to appease Angular's JIT compiler in dev mode (#323)
- Make hasStack(err) check more strict, making the unhandled rejection handler more robust and useful (#322)

### Changed
- Strip query strings and fragments from stackframe files (#328)
- Switch to upstream version of `fast-safe-stringify`


## 4.2.0 (2018-01-24)

This release fixes a few issues with the fetching of inline
script content, particularly after the location has changed
due to window.history methods.

Unhandled promise rejection should also contain more actionable
information (when the rejection reason is a DOMException, null,
or undefined). Support for Bluebird promises was also added.

### Added
- Support for unhandled bluebird promise rejections (#317)
- Option to prevent IP collection (#313)

### Changed
- Improved serialization of promise rejection reasons (#317)
- If a string was thrown and not caught, use it as the error message (#319)

### Fixed
- Collection of inline script content improved (#320, #318)


## 4.1.3 (2018-01-15)

### Fixed
- Fix call to non-existent `logger.log()` (credit @alexstrat #304)


## 4.1.2 (2018-01-09)

### Added
- Session sending now respects `notifyReleaseStages` option

### Changed
- Rename option `enableSessionTracking` -> `autoCaptureSessions` for consistency with other platforms


## 4.1.1 (2018-01-06)

### Fixed
- metaData and user were incorrectly attached to `report.app` (credit @tremlab #300)


## 4.1.0 (2018-01-05)

### Added
- Support for tracking sessions and overall crash rate by setting `sessionTrackingEnabled` to `true`.
In addition, sessions can be indicated manually using `bugsnagClient.startSession()` (#296)
- `user` and `metaData` can now be supplied in configuration object (#299)
- Bower and jspm support has been added as a result of #297 and some additional configuration

### Changed
- `dist` directory (built assets) are now stored in git (#297)


## 4.0.3 (2017-12-15)

### Changed
- Handle inline script content per older notifiers for consistent grouping (#289)

### Fixed
- Correctly capture the page contents when an inline script error happens (#289) 


## 4.0.2 (2017-12-14)

### Added
- Add more type exports (#286)
- Add frameworks section to README.md
- Add READMEs to examples

### Changed
- Add more detail to JS example (credit @tremlab, #284)
- Ensure empty/useless stackframes are removed
- Removed arbitrary timeouts from tests to alleviate CI flakiness

### Fixed
- Expose `metaData` and `user` types on `Client` class (#287)
- Give navigation details the correct type (some were marked as "manual")


## 4.0.1 (2017-12-07)

### Changed
- Improve type definition for notify() error argument (credit @rokerkony)
- Remove process.env.NODE_ENV inferred releaseStage
- Sidestep uglify's drop_compat option to prevent it from breaking bugsnag


## 4.0.0 (2017-12-04)

Version 4 is a milestone release. A complete re-write and modernization for Bugsnag's JS error reporting.

See UPGRADING.md for migrating from v3 and see docs.bugsnag.com for full documentation.

🚀

