# Changelog

## 6.4.3 (2019-10-21)

### Fixed
- (browser): Add browser alias to `dist/types/bugsnag` to fix Angular build failure [#632](https://github.com/bugsnag/bugsnag-js/pull/632) ([GDreyV](https://github.com/GDreyV))

## 6.4.2 (2019-10-09)

### Fixed
- (plugin-angular): Ensure Node notifier matches the type interface in the .d.ts file [#626](https://github.com/bugsnag/bugsnag-js/pull/626)

## 6.4.1 (2019-09-24)

### Fixed
- (plugin-koa): Ensure unhandled Koa errors are logged out and that non-errors don't generate two reports [#614](https://github.com/bugsnag/bugsnag-js/pull/614)
- (plugin-inline-script-content): Tolerate errors when trying to call existing installed handler [#613](https://github.com/bugsnag/bugsnag-js/issues/613) (fixes [#608](https://github.com/bugsnag/bugsnag-js/issues/608))
- (plugin-inline-script-content): Ensure line numbers are correct when error is at line 1/2/3 [#616](https://github.com/bugsnag/bugsnag-js/issues/616)
- (plugin-koa|express|restify): Ensure `clientIp` and `referer` are properly collected [#617](https://github.com/bugsnag/bugsnag-js/issues/617) (fixes [#615](https://github.com/bugsnag/bugsnag-js/issues/615))

## 6.4.0 (2019-08-13)

### Changed
- (expo): Support Expo SDK 34, dropping support for versions < 33 [#610](https://github.com/bugsnag/bugsnag-js/pull/610)

### Added
- (expo-cli): Check for the current version of Expo and install an appropriate version of `@bugsnag/expo` [#610](https://github.com/bugsnag/bugsnag-js/pull/610)

### Fixed
- (plugin-inline-script-content): Tolerate `WebDriverException: Message: Permission denied to access property "handleEvent"` errors when running in selenium [#605](https://github.com/bugsnag/bugsnag-js/pull/605)
- (core): Tolerate being bundled in strict mode [#584](https://github.com/bugsnag/bugsnag-js/pull/584)
- (plugin-inline-script-content): Ensure event handlers added before Bugsnag can be removed [#582](https://github.com/bugsnag/bugsnag-js/pull/582)
- (core): Update `error-stack-parser` to ensure spaces in filenames are parsed correctly [#612](https://github.com/bugsnag/bugsnag-js/pull/612)

## 6.3.2 (2019-06-27)

### Fixed

- (plugin-inline-script): Ensure inline script content callback doesn't cause error logs when there are no stackframes [#559](https://github.com/bugsnag/bugsnag-js/pull/559) / [#563](https://github.com/bugsnag/bugsnag-js/pull/563)
- (plugin-angular): Bundle an ES5 and an ES6 version of the plugin to support various Angular build settings [#565](https://github.com/bugsnag/bugsnag-js/pull/559) / [#563](https://github.com/bugsnag/bugsnag-js/pull/565)

## 6.3.1 (2019-06-17)

### Fixed

- (node): Ensure agent is passed through to http(s) request for proxy support [#548](https://github.com/bugsnag/bugsnag-js/pull/548) / [#546](https://github.com/bugsnag/bugsnag-js/pull/546)

## 6.3.0 (2019-05-28)

### Added

- (expo): Support configuration of post-publish hook, allowing On-premise users to customize the build/source map endpoints. [#542](https://github.com/bugsnag/bugsnag-js/pull/542)

### Changed

- (plugin-inline-script-content): Overhaul inline script tracking [#528](https://github.com/bugsnag/bugsnag-js/pull/528)
- (node): Add Node version string to report and session payloads (device.runtimeVersions) [#537](https://github.com/bugsnag/bugsnag-js/pull/537)
- (core): Update docs url so that it doesn't follow a redirect [#536](https://github.com/bugsnag/bugsnag-js/pull/536)
- (plugin-navigation-breadcrumbs): Compile away `_restore()` function from output bundle which is only used in tests [#533](https://github.com/bugsnag/bugsnag-js/pull/533)

### Fixed

- (plugin-koa): Send the correct status code when handling `ctx.throw()` errors [#541](https://github.com/bugsnag/bugsnag-js/pull/541)
- (plugin-angular): Target ES6 so that classes in the build are native, not polyfilled [#540](https://github.com/bugsnag/bugsnag-js/pull/540)
- (plugin-angular): Support subsequent rebuilds of an Angular app in AOT mode [#539](https://github.com/bugsnag/bugsnag-js/pull/539)
- (plugin-node-surrounding-code): Truncate line length so that minified code doesn't exceed payload limit [#531](https://github.com/bugsnag/bugsnag-js/pull/531)

## 6.2.0 (2019-04-23)

This release adds [`@bugsnag/expo`](http://docs.bugsnag.com/platforms/react-native/expo), a notifier for use on React Native apps that are built using [Expo](https://expo.io/).

A small internal change was made to facilitate this new notifier, but there are no changes required for existing users of documented APIs.

### Added

- (expo): a new top-level notifier `@bugsnag/expo` including a whole bunch of packages:
  - `@bugsnag/delivery-expo` - Expo-specific delivery mechanism which caches on disk when a crash happens, or the network is not available
  - `@bugsnag/plugin-expo-app` - gathers app information
  - `@bugsnag/plugin-expo-device` - gathers device information
  - `@bugsnag/plugin-react-native-app-state-breadcrumbs` - collects breadcrumbs when the app transitions to the foreground/background
  - `@bugsnag/plugin-react-native-connectivity-breadcrumbs` - collects breadcrumbs when the state of the network changes
  - `@bugsnag/plugin-react-native-global-error-handler` - reports unhandled errors
  - `@bugsnag/plugin-react-native-orientation-breadcrumbs` - collects breadcrumbs when the device orientation changes
  - `@bugsnag/plugin-react-native-unhandled-rejection` - reports unhandled promise rejections

### Changed

- (core): internal delivery interface now receives the `client` it is attached to on creation, and the `sendReport`/`sendSession` methods are no longer passed the `logger` and `config` objects which can be accesses on the client [#489](https://github.com/bugsnag/bugsnag-js/pull/489) (_Note: this was an undocumented internal API_)

## 6.1.0 (2019-04-12)

### Added

- (core): Improvements to logging and available information when error reports are not sent [#515](https://github.com/bugsnag/bugsnag-js/pull/515)

### Changed

- (delivery-node): Error stack is now included in first argument to logger [#486](https://github.com/bugsnag/bugsnag-js/pull/486)

### Removed

- (core): Stacktrace is omitted in error breadcrumbs (it's not used by the dashboard) [#512](https://github.com/bugsnag/bugsnag-js/pull/512)

## Fixed

- (plugin-navigation-breadcrumbs): `startSession()` is not called when `autoCaptureSessions=false` [#514](https://github.com/bugsnag/bugsnag-js/pull/514)
- (plugin-express): Express/Connect now send a 500 (not 200) HTTP status when about to crash [#513](https://github.com/bugsnag/bugsnag-js/pull/513)
- (core): Bad logic in `notify()` error normalisation [#516](https://github.com/bugsnag/bugsnag-js/pull/516)

## 6.0.0 (2019-02-21)

### Removed

- `request` is no longer used for sending error reports and sessions. This results in a much smaller dependency footprint. If you were using the `proxy` option or `http(s)_proxy` environment variables you will need to update your implementation to pass in a proxy agent. See the [proxy guide](https://docs.bugsnag.com/platforms/javascript/node-proxy/) on our docs for more information.

## Fixed

- Prevent incorrect warning about missing peer dependencies when using yarn (#478)
- Deduplicate module in browser bundle (#479)

## 5.2.0 (2019-01-21)

### Added

- Support serialising error objects (via. @bugsnag/safe-json-stringify@v4.0.0) (#356, #458)

### Fixed

- Fixed granular breadcrumb config logic (#461, #465, #466)

## 5.1.0 (2018-12-19)

### Fixed

- Support @bugsnag/node being consumed in a Webpack bundle for Node (#450, #441)

## 5.0.2 (2018-12-06)

### Fixed

- Tolerate errors accessing properties of an unhandled rejection event (#394, #442)
- Improve robustness of `window.onerror` callback, supporting additional jQuery parameter (#443, fixing #393 and #392)
- Add CORS header `Access-Control-Allow-Origin: *` to uploaded S3 assets (#444)

## 5.0.1 (2018-11-29)

### Fixed

- Ensure objects with a `null` prototype or bad `toString()` implementation don't cause an error in console breadcrumbs (#429)
- Ensure user ip is not collected when `collectUserIp=false` but user.id is explicitly `undefined` (#428)
- Ensure previous `window.onerror` callback is always called (#427)
- Ensure previous `window.onreadystatechange` callback is called (#426)
- Ensure log methods are correctly called and that relevant callbacks are called in the event of a report failure (#437)

### Added

- Nuxt.js example (#425)

## 5.0.0 (2018-11-21)

This is the first release of Bugsnag notifiers under the `@bugsnag` namespace.

This "universal" repository combines Bugsnag's browser and Node.js notifiers and so for continuity with the browser version, which was at v4, **the starting point for this monorepo and all of its packages is `v5.0.0`**.

See [UPGRADING.md](UPGRADING.md) for guidance on how to update your application.

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
