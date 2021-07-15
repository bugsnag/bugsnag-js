# Changelog

## TBC

### Added

- Server framework plugins now honour the `autoDetectErrors` configuration option [#1464](https://github.com/bugsnag/bugsnag-js/pull/1464)

### Changed

- (react-native): Update bugsnag-cocoa to v6.10.2
  - Fix ThreadSanitizer data race warning in `BSGAppHangDetector`. [bugsnag-cocoa#1153](https://github.com/bugsnag/bugsnag-cocoa/pull/1153)
  - Remove (duplicated) `user` information from `metaData`. [bugsnag-cocoa#1151](https://github.com/bugsnag/bugsnag-cocoa/pull/1151)
  - Fix a potential stack overflow in `+[BugsnagThread allThreadsWithCurrentThreadBacktrace:]`. [bugsnag-cocoa#1148](https://github.com/bugsnag/bugsnag-cocoa/pull/1148)
  - Fix `NSNull` handling in `+[BugsnagError errorFromJson:]` and `+[BugsnagStackframe frameFromJson:]`. [bugsnag-cocoa#1143](https://github.com/bugsnag/bugsnag-cocoa/pull/1143)
  - Fix a rare crash in `bsg_ksmachgetThreadQueueName`. [bugsnag-cocoa#1147](https://github.com/bugsnag/bugsnag-cocoa/pull/1147)
- (react-native): Update bugsnag-android to v5.10.0
  - Capture process name in Event payload
    [bugsnag-android#1318](https://github.com/bugsnag/bugsnag-android/pull/1318)
  - Avoid unnecessary BroadcastReceiver registration for monitoring device orientation
    [bugsnag-android#1303](https://github.com/bugsnag/bugsnag-android/pull/1303)
  - Register system callbacks on background thread
    [bugsnag-android#1292](https://github.com/bugsnag/bugsnag-android/pull/1292)
  - Fix rare NullPointerExceptions from ConnectivityManager
    [bugsnag-android#1311](https://github.com/bugsnag/bugsnag-android/pull/1311)
  - Respect manual setting of context
    [bugsnag-android#1310](https://github.com/bugsnag/bugsnag-android/pull/1310)
  - Handle interrupt when shutting down executors
    [bugsnag-android#1315](https://github.com/bugsnag/bugsnag-android/pull/1315)
  - React Native: allow serializing enabledBreadcrumbTypes as null
    [bugsnag-android#1316](https://github.com/bugsnag/bugsnag-android/pull/1316)
  - Unity: Properly handle ANRs after multiple calls to autoNotify and autoDetectAnrs
    [bugsnag-android#1265](https://github.com/bugsnag/bugsnag-android/pull/1265)
  - Cache value of app.backgroundWorkRestricted
    [bugsnag-android#1275](https://github.com/bugsnag/bugsnag-android/pull/1275)
  - Optimize execution of callbacks
    [bugsnag-android#1276](https://github.com/bugsnag/bugsnag-android/pull/1276)
  - Optimize implementation of internal state change observers
    [bugsnag-android#1274](https://github.com/bugsnag/bugsnag-android/pull/1274)
  - Optimize metadata implementation by reducing type casts
    [bugsnag-android#1277](https://github.com/bugsnag/bugsnag-android/pull/1277)
  - Trim stacktraces to <200 frames before attempting to construct POJOs
    [bugsnag-android#1281](https://github.com/bugsnag/bugsnag-android/pull/1281)
  - Use direct field access when adding breadcrumbs and state updates
    [bugsnag-android#1279](https://github.com/bugsnag/bugsnag-android/pull/1279)
  - Avoid using regex to validate api key
    [bugsnag-android#1282](https://github.com/bugsnag/bugsnag-android/pull/1282)
  - Discard unwanted automatic data earlier where possible
    [bugsnag-android#1280](https://github.com/bugsnag/bugsnag-android/pull/1280)
  - Enable ANR handling on immediately if started from the main thread
    [bugsnag-android#1283](https://github.com/bugsnag/bugsnag-android/pull/1283)
  - Include `app.binaryArch` in all events
    [bugsnag-android#1287](https://github.com/bugsnag/bugsnag-android/pull/1287)
  - Cache results from PackageManager
    [bugsnag-android#1288](https://github.com/bugsnag/bugsnag-android/pull/1288)
  - Use ring buffer to store breadcrumbs
    [bugsnag-android#1286](https://github.com/bugsnag/bugsnag-android/pull/1286)
  - Avoid expensive set construction in Config constructor
    [bugsnag-android#1289](https://github.com/bugsnag/bugsnag-android/pull/1289)
  - Replace calls to String.format() with concatenation
    [bugsnag-android#1293](https://github.com/bugsnag/bugsnag-android/pull/1293)
  - Optimize capture of thread traces
    [bugsnag-android#1300](https://github.com/bugsnag/bugsnag-android/pull/1300)

### Fixed

- Breadcrumbs will now be left when `enabledBreadcrumbTypes` is `null` [#1466](https://github.com/bugsnag/bugsnag-js/pull/1466)
- Avoid crash when `enabledBreadcrumbTypes` is `null` [#1467](https://github.com/bugsnag/bugsnag-js/pull/1467)

## 7.10.5 (2021-07-05)

### Fixed

- (plugin-console-breadcrumbs): Ensure console breadcrumbs do not run in Expo's dev environment and obscure log line numbers [#1453](https://github.com/bugsnag/bugsnag-js/pull/1453)
- (browser): "Bugsnag" loaded breadcrumb now has the type "state" rather than "navigation" [#1460](https://github.com/bugsnag/bugsnag-js/pull/1460)
- (plugin-react-native-unhandled-rejections): Remove flow syntax [#1461](https://github.com/bugsnag/bugsnag-js/pull/1461)

### Added

- (expo): User ID now defaults to `device.id` if no user is set [#1454](https://github.com/bugsnag/bugsnag-js/pull/1454)
- (browser): User ID now defaults to `device.id` if no user is set (when `collectUserIp=false`) [#1456](https://github.com/bugsnag/bugsnag-js/pull/1456)

### Changed

- (react-native): Update bugsnag-cocoa to v6.10.0
  - Fix an issue that could cause C++ exceptions with very long descriptions to not be reported. [bugsnag-cocoa#1137](https://github.com/bugsnag/bugsnag-cocoa/pull/1137)
  - Improve performance of adding metadata by using async file I/O. [bugsnag-cocoa#1133](https://github.com/bugsnag/bugsnag-cocoa/pull/1133)
  - Improve performance of leaving breadcrumbs by using async file I/O. [bugsnag-cocoa#1124](https://github.com/bugsnag/bugsnag-cocoa/pull/1124)

## 7.10.4 (2021-06-28)

### Fixed

- (expo): Prevent internal NetInfo connectivy requests from showing as breadcrumbs [#1443](https://github.com/bugsnag/bugsnag-js/pull/1443)

### Changed

- (react-native): Update bugsnag-cocoa to v6.9.7
  - Prevent some potential false positive detection of app hangs. [bugsnag-cocoa#1122](https://github.com/bugsnag/bugsnag-cocoa/pull/1122)
  - Improve accuracy of app hang event information to better reflect state at time of detection. [bugsnag-cocoa#1118](https://github.com/bugsnag/bugsnag-cocoa/pull/1118)

## 7.10.3 (2021-06-15)

### Fixed

- (react-native): Ensure source maps are uploaded correctly in Xcode for RN <0.64 [#1438](https://github.com/bugsnag/bugsnag-js/pull/1438)

### Changed

- (react-native): Update bugsnag-cocoa to v6.9.5
  - Stop app hangs being reported if app is launched in the background. [bugsnag-cocoa#1112](https://github.com/bugsnag/bugsnag-cocoa/pull/1112)
  - Stop session being reported if app is launched in the background. [bugsnag-cocoa#1107](https://github.com/bugsnag/bugsnag-cocoa/pull/1107)
  - Fix KSCrash state storage for apps with no CFBundleName. [bugsnag-cocoa#1103](https://github.com/bugsnag/bugsnag-cocoa/pull/1103)

## 7.10.2 (2021-06-07)

### Fixed

- (react-native): Prevent unhandled promise rejections being split into multiple log calls [#1419](https://github.com/bugsnag/bugsnag-js/pull/1419)

### Changed

- (react-native): Update bugsnag-cocoa to v6.9.4
  - Improve performance of `notify()`. [bugsnag-cocoa#1102](https://github.com/bugsnag/bugsnag-cocoa/pull/1102) [bugsnag-cocoa#1104](https://github.com/bugsnag/bugsnag-cocoa/pull/1104) [bugsnag-cocoa#1105](https://github.com/bugsnag/bugsnag-cocoa/pull/1105)
  - Fix a crash in `-[BugsnagApp deserializeFromJson:]` if main Mach-O image could not be identified, and improve reliability of identification. [bugsnag-cocoa#1097](https://github.com/bugsnag/bugsnag-cocoa/issues/1097) [bugsnag-cocoa#1101](https://github.com/bugsnag/bugsnag-cocoa/pull/1101)
  - Remove need for `-ObjC` linker flag if linking Bugsnag as a static library. [bugsnag-cocoa#1098](https://github.com/bugsnag/bugsnag-cocoa/pull/1098)
- (react-native): Update bugsnag-android to v5.9.4
  - Unity: add methods for setting autoNotify and autoDetectAnrs
    [bugsnag-android#1233](https://github.com/bugsnag/bugsnag-android/pull/1233)
  - Including bugsnag.h in C++ code will no longer cause writable-strings warnings
    [bugsnag-android#1260](https://github.com/bugsnag/bugsnag-android/pull/1260)
  - Small performance improvements to device and app state collection
    [bugsnag-android#1258](https://github.com/bugsnag/bugsnag-android/pull/1258)
  - NDK: lowMemory attribute is now reported as expected
    [bugsnag-android#1262](https://github.com/bugsnag/bugsnag-android/pull/1262)
  - Don't include loglog.so in ndk plugin builds performed on Linux
    [bugsnag-android#1263](https://github.com/bugsnag/bugsnag-android/pull/1263)
- (react-native): Only include `codeBundleId` in payload if it has a value [#1426](https://github.com/bugsnag/bugsnag-js/pull/1426)

## 7.10.1 (2021-05-25)

### Changed

- (react-native): Update bugsnag-cocoa to v6.9.2
  - Add a mechanism for reporting errors that occur within the notifier. [bugsnag-cocoa#1089](https://github.com/bugsnag/bugsnag-cocoa/pull/1089)
  - Fix compiler warnings when additional warning flags are enabled. [bugsnag-cocoa#1092](https://github.com/bugsnag/bugsnag-cocoa/pull/1092) [bugsnag-cocoa#1094](https://github.com/bugsnag/bugsnag-cocoa/pull/1094)
- (react-native): Update bugsnag-android to v5.9.3
  - Avoid unnecessary collection of Thread stacktraces
    [bugsnag-android#1249](https://github.com/bugsnag/bugsnag-android/pull/1249)
  - Prevent errors in rare cases where either ConnectivityManager or StorageManager is not available
    [bugsnag-android#1251](https://github.com/bugsnag/bugsnag-android/pull/1251)
  - Change the Bugsnag-Internal-Error header to "bugsnag-android"
    [bugsnag-android#1252](https://github.com/bugsnag/bugsnag-android/pull/1252)
  - Prevent resource exhaustion when Throwable cause chains are recursive
    [bugsnag-android#1255](https://github.com/bugsnag/bugsnag-android/pull/1255)
  - Added Date support to ObjectJsonStreamer
    [bugsnag-android#1256](https://github.com/bugsnag/bugsnag-android/pull/1256)
- (browser,node): Add default `appType` [#1415](https://github.com/bugsnag/bugsnag-js/pull/1415)

### Fixed

- (react-native): Always upload JS bundle (rather than .hbc bundle) during Xcode source map upload build phase

## v7.10.0 (2021-05-18)

This release adds [`@bugsnag/electron`](http://docs.bugsnag.com/platforms/electron), a notifier for use on apps that are built using Electron.

### Added

- (electron): a new top-level notifier `@bugsnag/electron` and related plugins

### Changed

- (node): File paths in stacktraces now always use `/` as the path separator
- (node): Surrounding code can be fetched from file paths that are relative to the project root
- (react-native): Update bugsnag-android to v5.9.2
  - Guard against exceptions with null stack traces
    [bugsnag-android#1239](https://github.com/bugsnag/bugsnag-android/pull/1239)
  - Fix bug that terminated the app when multiple ANRs occur
    [bugsnag-android#1235](https://github.com/bugsnag/bugsnag-android/pull/1235)
  - Prevent rare NPE in log message
    [bugsnag-android#1238](https://github.com/bugsnag/bugsnag-android/pull/1238)
  - Prevent rare NPE when capturing thread traces
    [bugsnag-android#1237](https://github.com/bugsnag/bugsnag-android/pull/1237)
  - Catch exceptions thrown by Context.registerReceiver to prevent rare crashes
    [bugsnag-android#1240](https://github.com/bugsnag/bugsnag-android/pull/1240)
  - Fix possible NegativeArraySizeException in crash report deserialization
    [bugsnag-android#1245](https://github.com/bugsnag/bugsnag-android/pull/1245)

## v7.9.6 (2021-05-05)

### Added

- (react-native-cli): Add support for ejected Expo apps [#1365](https://github.com/bugsnag/bugsnag-js/pull/1365)
- (react-native): Add support for Xcode 12 [#1314](https://github.com/bugsnag/bugsnag-js/pull/1314)

### Changed

- (react-native): Update bugsnag-cocoa to v6.9.1
  - Fix a possible deadlock when writing crash reports for uncaught Objective-C exceptions. [bugsnag-cocoa#1082](https://github.com/bugsnag/bugsnag-cocoa/pull/1082)
  - Fix missing `context` for crash, OOM, and app hang errors. [bugsnag-cocoa#1079](https://github.com/bugsnag/bugsnag-cocoa/pull/1079)
  - Fix `app` properties in OOMs for apps that override `appType`, `appVersion`, `bundleVersion` or `releaseStage` in their config. [bugsnag-cocoa#1078](https://github.com/bugsnag/bugsnag-cocoa/pull/1078)
  - `event.threads` will now be empty, rather than containing a single thread, if `sendThreads` dictates that threads should not be sent. [bugsnag-cocoa#1077](https://github.com/bugsnag/bugsnag-cocoa/pull/1077)

## v7.9.5 (2021-04-26)

### Changed

- (react-native): Update bugsnag-cocoa to v6.9.0
  - App hangs that occur while an app is in the background will no longer be reported. [bugsnag-cocoa#1075](https://github.com/bugsnag/bugsnag-cocoa/pull/1075)
  - Add `binaryArch` and `runningOnRosetta` to the `app` metadata tab. [bugsnag-cocoa#1073](https://github.com/bugsnag/bugsnag-cocoa/pull/1073)
  - Bugsnag can now be used without AppKit, allowing use in daemons and other processes running in non-UI sessions. [bugsnag-cocoa#1072](https://github.com/bugsnag/bugsnag-cocoa/pull/1072)
- (react-native): Update bugsnag-android to v5.9.1
  - Add projectPackages field to error payloads [bugsnag-android#1226](https://github.com/bugsnag/bugsnag-android/pull/1226)
  - Fix deserialization bug in persisted NDK errors [bugsnag-android#1220](https://github.com/bugsnag/bugsnag-android/pull/1220)

## v7.9.4 (2021-04-19)

### Changed

- (react-native): Update bugsnag-cocoa to v6.8.4
  - `macCatalystiOSVersion` is now reported for apps built with Mac Catalyst and iOS app running on Apple silicon. [bugsnag-cocoa#1066](https://github.com/bugsnag/bugsnag-cocoa/pull/1066)
  - Fix crashes that could occur in `bsg_recordException` in low memory conditions. [bugsnag-cocoa#1068](https://github.com/bugsnag/bugsnag-cocoa/pull/1068)
  - Fix a crash in `bsg_ksmachgetThreadQueueName`. [bugsnag-cocoa#1065](https://github.com/bugsnag/bugsnag-cocoa/pull/1065)
  - Improve timestamp accuracy to fix breadcrumbs that are reported to occur after the error. [bugsnag-cocoa#1062](https://github.com/bugsnag/bugsnag-cocoa/pull/1062)

### Fixed

- (plugin-aws-lambda): Change Typescript definitions for compatibility with `@types/aws-lambda` [#1353](https://github.com/bugsnag/bugsnag-js/pull/1353) ([k-ish](https://github.com/h-kishi))

## v7.9.3 (2021-04-12)

### Changed

- (react-native): Update bugsnag-cocoa to v6.8.3
  - Catch exceptions thrown while preparing JSON for upload rather than crashing. [bugsnag-cocoa#1063](https://github.com/bugsnag/bugsnag-cocoa/pull/1063)
  - Prevent app hangs being reported if a debugger is attached. [bugsnag-cocoa#1058](https://github.com/bugsnag/bugsnag-cocoa/pull/1058)
  - Improve support for Mac Catalyst and iOS apps running on macOS.
  [bugsnag-cocoa#1056](https://github.com/bugsnag/bugsnag-cocoa/pull/1056)
  [bugsnag-cocoa#1055](https://github.com/bugsnag/bugsnag-cocoa/pull/1055)
  [bugsnag-cocoa#1053](https://github.com/bugsnag/bugsnag-cocoa/pull/1053)

## v7.9.2 (2021-04-06)

### Changed

- (react-native): Update bugsnag-cocoa to v6.8.1
  - Fix unreliable ordering of breadcrumbs. [bugsnag-cocoa#1049](https://github.com/bugsnag/bugsnag-cocoa/pull/1049)
- (react-native): Update bugsnag-android to v5.9.0
  - Bump compileSdkVersion to apiLevel 30 [bugsnag-android#1202](https://github.com/bugsnag/bugsnag-android/pull/1202)
  - Collect whether the system has restricted background work for the app [bugsnag-android#1211](https://github.com/bugsnag/bugsnag-android/pull/1211)
  - Improve detection of rooted devices [bugsnag-android#1194](https://github.com/bugsnag/bugsnag-android/pull/1194)
  [bugsnag-android#1195](https://github.com/bugsnag/bugsnag-android/pull/1195)
  [bugsnag-android#1198](https://github.com/bugsnag/bugsnag-android/pull/1198)
  [bugsnag-android#1200](https://github.com/bugsnag/bugsnag-android/pull/1200)
  [bugsnag-android#1201](https://github.com/bugsnag/bugsnag-android/pull/1201)

## v7.9.1 (2021-03-25)

### Changed

- (react-native): Update bugsnag-cocoa to v6.8.0
  - Detect app hangs that make your app unresponsive. [bugsnag-cocoa#1039](https://github.com/bugsnag/bugsnag-cocoa/pull/1039)
  - Fix a heap buffer overflow reported by Address Sanitizer. [bugsnag-cocoa#1043](https://github.com/bugsnag/bugsnag-cocoa/pull/1043)
  - Fix parsing of `callStackSymbols` where the image name contains spaces. [bugsnag-cocoa#1036](https://github.com/bugsnag/bugsnag-cocoa/pull/1036)
  - Fix a possible deadlock when writing crash reports for unhandled errors. [bugsnag-cocoa#1034](https://github.com/bugsnag/bugsnag-cocoa/pull/1034)
- (react-native): Update bugsnag-android to v5.8.0
  - `Configuration#launchCrashThresholdMs` is deprecated in favour of `Configuration#launchDurationMillis`
  - Add public API for crash-on-launch detection. [bugsnag-android#1157](https://github.com/bugsnag/bugsnag-android/pull/1157)
  [bugsnag-android#1159](https://github.com/bugsnag/bugsnag-android/pull/1159)
  [bugsnag-android#1165](https://github.com/bugsnag/bugsnag-android/pull/1165)
  [bugsnag-android#1164](https://github.com/bugsnag/bugsnag-android/pull/1164)
  [bugsnag-android#1182](https://github.com/bugsnag/bugsnag-android/pull/1182)
  [bugsnag-android#1184](https://github.com/bugsnag/bugsnag-android/pull/1184)
  [bugsnag-android#1185](https://github.com/bugsnag/bugsnag-android/pull/1185)
  [bugsnag-android#1186](https://github.com/bugsnag/bugsnag-android/pull/1186)
  [bugsnag-android#1180](https://github.com/bugsnag/bugsnag-android/pull/1180)
  [bugsnag-android#1188](https://github.com/bugsnag/bugsnag-android/pull/1188)
  [bugsnag-android#1191](https://github.com/bugsnag/bugsnag-android/pull/1191)

## v7.9.0 (2021-03-16)

### Added

- (plugin-aws-lambda): Add support for Node.js on AWS Lambda. See the [docs](https://docs.bugsnag.com/platforms/javascript/aws-lambda/) for usage. [#1334](https://github.com/bugsnag/bugsnag-js/pull/1334)

### Changed

- (plugin-koa): Ensure `ctx.request.body` is present on the event's request property by collecting it at the last possible moment [#1292](https://github.com/bugsnag/bugsnag-js/pull/1292)
- (react-native): Update bugsnag-cocoa to v6.7.1
  - Fix `os_proc_available_memory` runtime link error on Mac Catalyst. [bugsnag-cocoa#1025](https://github.com/bugsnag/bugsnag-cocoa/pull/1025)
  - Fix missing `osName` and `osVersion` for errors reported from app extensions that do not link against UIKit. [bugsnag-cocoa#1022](https://github.com/bugsnag/bugsnag-cocoa/pull/1022)
  - Fix incorrect `freeMemory` for errors reported via `notify()` [bugsnag-cocoa#1021](https://github.com/bugsnag/bugsnag-cocoa/pull/1021)

## v7.8.2 (2021-03-04)

### Changed

- (react-native): Update bugsnag-cocoa to v6.7.0
  - Identify crashes that occur whilst your app is launching. [bugsnag-cocoa#1004](https://github.com/bugsnag/bugsnag-cocoa/pull/1004)
  - Fix inaccurate `app.duration` after multiple calls to `notify()` [bugsnag-cocoa#1014](https://github.com/bugsnag/bugsnag-cocoa/pull/1014)
  - Fix a possible deadlock when writing crash reports for unhandled errors. [bugsnag-cocoa#1013](https://github.com/bugsnag/bugsnag-cocoa/pull/1013)
- (react-native): Update bugsnag-android to v5.7.1
  - Fix for bad pointer access crash in JNI deliverReportAtPath [bugsnag-android#1169](https://github.com/bugsnag/bugsnag-android/pull/1169)
  - Check additional JNI calls for pending exceptions and no-op [bugsnag-android#1142](https://github.com/bugsnag/bugsnag-android/pull/1142)
  - Move free() call to exit block [bugsnag-android#1140](https://github.com/bugsnag/bugsnag-android/pull/1140)
  - Replace strncpy() usage with safe function call [bugsnag-android#1149](https://github.com/bugsnag/bugsnag-android/pull/1149)
  - Prevent NPE when delivering internal error reports [bugsnag-android#1150](https://github.com/bugsnag/bugsnag-android/pull/1150)
  - Further robustify string copying and JNI exception checks [bugsnag-android#1153](https://github.com/bugsnag/bugsnag-android/pull/1153)
  - Support native stack traces in the ANR plugin [bugsnag-android#972](https://github.com/bugsnag/bugsnag-android/pull/972)

### Fixed

- (expo): Ensure Expo plugins depend on same version of NetInfo package [#1319](https://github.com/bugsnag/bugsnag-js/pull/1319)

## v7.8.1 (2021-02-25)

### Changed

- (react-native): Update bugsnag-cocoa to v6.6.4
  - Fix possible deadlock when recording thread information for handled errors [bugsnag-cocoa#1011](https://github.com/bugsnag/bugsnag-cocoa/pull/1011)
  - Fix Swift 5.4 fatal error message parsing [bugsnag-cocoa#1010](https://github.com/bugsnag/bugsnag-cocoa/pull/1010)
  - Improve accuracy of jailbreak detection [bugsnag-cocoa#1000](https://github.com/bugsnag/bugsnag-cocoa/pull/1000)

## v7.8.0 (2021-02-22)

### Changed

- (react-native): Update bugsnag-cocoa to v6.6.3
  - Improve performance of thread recording for handled errors [bugsnag-cocoa#992](https://github.com/bugsnag/bugsnag-cocoa/pull/992)
  - Stop Bugsnag unregistering other signal handlers when catching a mach exception [bugsnag-cocoa#976](https://github.com/bugsnag/bugsnag-cocoa/pull/976)/[bugsnag-cocoa#1002](https://github.com/bugsnag/bugsnag-cocoa/pull/1002)
  - Fix a tvOS file permission error that was introduced in 6.5.1 [bugsnag-cocoa#996](https://github.com/bugsnag/bugsnag-cocoa/pull/996)
  - Fix an analyzer warning [bugsnag-cocoa#994](https://github.com/bugsnag/bugsnag-cocoa/pull/994)

### Added

- (react-native): Capture additional native stack for native promise rejections [#1253](https://github.com/bugsnag/bugsnag-js/pull/1253)

## v7.7.0 (2021-02-15)

### Changed

- (react-native): Update bugsnag-android to v5.6.2
  - Check additional JNI calls for pending exceptions and no-op [bugsnag-android#1133](https://github.com/bugsnag/bugsnag-android/pull/1133)
  - Fix rare crash when loading device ID [bugsnag-android#1137](https://github.com/bugsnag/bugsnag-android/pull/1137)
- (react-native): Update bugsnag-cocoa to v6.6.1
  - Fix compiler warnings when importing Bugsnag from Objective-C sources that do not use ARC. [bugsnag-cocoa#985](https://github.com/bugsnag/bugsnag-cocoa/pull/985)
  - Fix a rare crash that could occur in the event of JSON parsing failures. [bugsnag-cocoa#987](https://github.com/bugsnag/bugsnag-cocoa/pull/987)
- (plugin-vue): Add support for Vue 3 [#1280](https://github.com/bugsnag/bugsnag-js/pull/1280)

### Fixed

- (plugin-inline-script-content): Ensure inline script content isn't included when the DOM `onreadystatechange` `interactive` event is missed. [#1290](https://github.com/bugsnag/bugsnag-js/pull/1290)

## v7.6.1 (2021-01-26)

## Changed

- (react-native): Update bugsnag-cocoa to v6.6.0
  - The NSError `userInfo` property is now included in reports. [bugsnag-cocoa#974](https://github.com/bugsnag/bugsnag-cocoa/pull/974)
- (react-native): Update bugsnag-android to v5.5.1
  - Alter ANR SIGQUIT handler to stop interfering with Google's ANR reporting, and to avoid unsafe JNI calls from within a signal handler [bugsnag-android#1078](https://github.com/bugsnag/bugsnag-android/pull/1078)
  - Alter HTTP requests to stop using chunked transfer encoding [bugsnag-android#1077](https://github.com/bugsnag/bugsnag-android/pull/1077)
  - Allow null device IDs, preventing rare crash in Bugsnag initialization [bugsnag-android#1083](https://github.com/bugsnag/bugsnag-android/pull/1083)

### Fixed

- (react-native):  Ensure plugin usage is compatible with running an app in a remote debugger [#1250](https://github.com/bugsnag/bugsnag-js/pull/1250)

## v7.6.0 (2021-01-18)

As of 7.6.0 the monorepo contains `@bugsnag/react-native-cli`, a new command line tool to help set up Bugsnag in React Native projects.

### Added

- (react-native-cli): New `@bugsnag/react-native-cli` package. [#1214](https://github.com/bugsnag/bugsnag-js/pull/1214)
- (react-native): Source map upload script to be run as an Xcode build phase. [#1214](https://github.com/bugsnag/bugsnag-js/pull/1214)

### Changed

- (expo): `app.type` will now default to 'ios' or 'android'. [1244](https://github.com/bugsnag/bugsnag-js/pull/1244)
- (react-native): Deprecate use of `bugsnag-react-native.gradle` in favour of [Bugsnag Android Gradle Plugin](https://github.com/bugsnag/bugsnag-android-gradle-plugin/). [#1214](https://github.com/bugsnag/bugsnag-js/pull/1214)
- (react-native): Update bugsnag-cocoa to v6.5.1
  - Fix a regression where OOM events were missing session information. [bugsnag-cocoa#963](https://github.com/bugsnag/bugsnag-cocoa/pull/963)
  - Make `maxPersistedEvents` and `maxPersistedSessions` default to 32 and 128, respectively. [bugsnag-cocoa#966](https://github.com/bugsnag/bugsnag-cocoa/pull/966)

### Fixed

- (react-native): Ensure unhandled promise warning is logged in development [#1235](https://github.com/bugsnag/bugsnag-js/pull/1235)
- (core): the `OnErrorCallback` type definition now allows `Promise<boolean>` as a return type. [#1224](https://github.com/bugsnag/bugsnag-js/pull/1224)

## v7.5.6 (2021-01-11)

### Changed

- (expo): Add support for Expo SDK v40 [#1219](https://github.com/bugsnag/bugsnag-js/pull/1219)
- (react-native): Update bugsnag-cocoa to v6.5.0
  - Add `errorClass` configuration option. [bugsnag-cocoa#938](https://github.com/bugsnag/bugsnag-cocoa/pull/938)
  - Add `maxPersistedEvents` configuration option. [bugsnag-cocoa#936](https://github.com/bugsnag/bugsnag-cocoa/pull/936)
  - Add `maxPersistedSessions` configuration option. [bugsnag-cocoa#943](https://github.com/bugsnag/bugsnag-cocoa/pull/943)
  - Add `[Bugsnag]` prefix to log messages. [bugsnag-cocoa#955](https://github.com/bugsnag/bugsnag-cocoa/pull/955)
  - Fix reliability of Swift fatal error message reporting. [bugsnag-cocoa#948](https://github.com/bugsnag/bugsnag-cocoa/pull/948)
- (react-native): Update bugsnag-android to v5.5.0

  This release supports initializing Bugsnag in multi processes apps. If your app uses Bugsnag in multiple processes, you should initialize Bugsnag
  with a unique `persistenceDirectory` value for each process. Please see [the docs](https://docs.bugsnag.com/platforms/android/faq/#does-bugsnag-support-multi-process-apps) for further information.
  - Store user information in persistenceDirectory [bugsnag-android#1017](https://github.com/bugsnag/bugsnag-android/pull/1017)
  - Use consistent device ID for multi process apps [bugsnag-android#1013](https://github.com/bugsnag/bugsnag-android/pull/1013)
  - Create synchronized store for user information [bugsnag-android#1010](https://github.com/bugsnag/bugsnag-android/pull/1010)
  - Add persistenceDirectory config option for controlling event/session storage [bugsnag-android#998](https://github.com/bugsnag/bugsnag-android/pull/998)
  - Add configuration option to control maximum number of persisted events/sessions [bugsnag-android#980](https://github.com/bugsnag/bugsnag-android/pull/980)
  - Increase kotlin dependency version to 1.3.72 [bugsnag-android#1050](https://github.com/bugsnag/bugsnag-android/pull/1050)

## v7.5.5 (2020-12-14)

### Changed

- (react-native): Update bugsnag-cocoa to v6.4.1
  - Place "unhandledOverridden" inside "severityReason" instead of at the top level. [#937](https://github.com/bugsnag/bugsnag-cocoa/pull/937)
  - Allow overriding the "unhandled" flag in error callbacks. [#921](https://github.com/bugsnag/bugsnag-cocoa/pull/921) [#912](https://github.com/bugsnag/bugsnag-cocoa/pull/912)
  - Fix unexpected exception behavior when started without an API key. [#931](https://github.com/bugsnag/bugsnag-cocoa/pull/931)
- (react-native): Update bugsnag-android to v5.4.0
  - Prevent potential SHA-1 hash mismatch in Bugsnag-Integrity header for session requests [#1043](https://github.com/bugsnag/bugsnag-android/pull/1043)
  - Make `event.unhandled` overridable for NDK errors [#1037](https://github.com/bugsnag/bugsnag-android/pull/1037)
  - Make `event.unhandled` overridable for React Native errors [#1039](https://github.com/bugsnag/bugsnag-android/pull/1039)
  - Make `event.unhandled` overridable for JVM errors [#1025](https://github.com/bugsnag/bugsnag-android/pull/1025)
- (expo): Update the `postPublish` hook to use the new `@bugsnag/source-maps` library. [#1124]

## v7.5.4 (2020-12-10)

### Changed

- (expo): Add integrity header to verify Error and Session API payloads have not changed. [#1172](https://github.com/bugsnag/bugsnag-js/pull/1172)
- (react-native): Update bugsnag-android to v5.3.1
  - Add integrity header to verify Error and Session API payloads have not changed. [bugsnag-android#978](https://github.com/bugsnag/bugsnag-android/pull/978)
  - Prevent potential SHA-1 hash mismatch in Bugsnag-Integrity header [#1028](https://github.com/bugsnag/bugsnag-android/pull/1028)
- (react-native): Update bugsnag-cocoa to v6.3.0
  - Add integrity header to verify Error and Session API payloads have not changed. [bugsnag-cocoa#881](https://github.com/bugsnag/bugsnag-cocoa/pull/881)
  - Out Of Memory errors now include more information, including custom metadata and user information. [bugsnag-cocoa#915](https://github.com/bugsnag/bugsnag-cocoa/pull/915) [bugsnag-cocoa#908](https://github.com/bugsnag/bugsnag-cocoa/pull/908)
  - Fixed incorrect app version reported when sending crash reports from older versions of Bugsnag (before 6.2.3) [bugsnag-cocoa#911](https://github.com/bugsnag/bugsnag-cocoa/pull/911)
  - Fixed a rare crash in -[BugsnagClient computeDidCrashLastLaunch] [bugsnag-cocoa#917](https://github.com/bugsnag/bugsnag-cocoa/pull/917)
- (core) The `event.unhandled` flag can now be changed in callbacks [#1148](https://github.com/bugsnag/bugsnag-js/pull/1148)

## v7.5.3 (2020-12-01)

- (react-native): Update bugsnag-cocoa to v6.2.5
  - Fixed a rare crash due to a race condition in BugsnagSystemState. [bugsnag-cocoa#893](https://github.com/bugsnag/bugsnag-cocoa/pull/893)
  - Out Of Memory errors are no longer reported if a device reboot was detected. [bugsnag-cocoa#822](https://github.com/bugsnag/bugsnag-cocoa/pull/882)

## v7.5.2 (2020-11-09)

### Changed

- (react-native): Update bugsnag-cocoa to v6.2.4
  - The `onCrashHandler` is no longer called in the event of an OOM. [bugsnag-cocoa#874](https://github.com/bugsnag/bugsnag-cocoa/pull/874)
  - os_proc_available_memory() is now used to get free memory, if available. [bugsnag-cocoa#851](https://github.com/bugsnag/bugsnag-cocoa/pull/851)
  - CPU and memory impact of leaving breadcrumbs has been reduced. [bugsnag-cocoa#851](https://github.com/bugsnag/bugsnag-cocoa/pull/851)
  - Fix app version reported for crashes that occur before an upgrade. [bugsnag-cocoa#862](https://github.com/bugsnag/bugsnag-cocoa/pull/862)
  - Catch exceptions when (de)serializing JSON. [bugsnag-cocoa#856](https://github.com/bugsnag/bugsnag-cocoa/pull/856)
- (react-native): Update bugsnag-android to v5.2.3 [#1119](https://github.com/bugsnag/bugsnag-js/pull/1119)
  - Flush persisted sessions on launch and on connectivity changes
    [bugsnag-android#973](https://github.com/bugsnag/bugsnag-android/pull/973)
  - Increase breadcrumb time precision to milliseconds
    [bugsnag-android#954](https://github.com/bugsnag/bugsnag-android/pull/954)
  - Default to allowing requests when checking connectivity
    [bugsnag-android#970](https://github.com/bugsnag/bugsnag-android/pull/970)
  - Support changing NDK Event's api key in OnErrorCallback
    [bugsnag-android#964](https://github.com/bugsnag/bugsnag-android/pull/964)

## v7.5.1 (2020-10-23)

### Fixed

- (browser): Added missing type definition for `trackInlineScripts` option [#1102](https://github.com/bugsnag/bugsnag-js/pull/1102) / [#1097](https://github.com/bugsnag/bugsnag-js/pull/1097)

### Changed

- (expo): Bump expo dependency versions to keep in sync [#1103](https://github.com/bugsnag/bugsnag-js/pull/1103)
- (react-native): Update bugsnag-cocoa to v6.2.2
  - Support "foreground" duration in MacOS as well. [bugsnag-cocoa#848](https://github.com/bugsnag/bugsnag-cocoa/pull/848)
  - Timestamp accuracy in reports has been increased from seconds to milliseconds. [bugsnag-cocoa#847](https://github.com/bugsnag/bugsnag-cocoa/pull/847)
  - Calculation of "foreground" duration now also includes time in UIApplicationStateActive and UIApplicationStateInactive states in order to match Apple's definition of "foreground". [bugsnag-cocoa#839](https://github.com/bugsnag/bugsnag-cocoa/pull/839)
- (react-native): Update bugsnag-android to v5.2.2
  - Avoid crash when initializing bugsnag in attachBaseContext [bugsnag-android#953](https://github.com/bugsnag/bugsnag-android/pull/953)
  - Prevent ConcurrentModificationException when setting redactedKeys [bugsnag-android#947](https://github.com/bugsnag/bugsnag-android/pull/947)


## 7.5.0 (2020-10-08)

### Added

- (plugin-react-native-navigation): New plugin that integrates with React Native Navigation. [#1065](https://github.com/bugsnag/bugsnag-js/pull/1065)
- (plugin-react-navigation): New plugin that integrates with React Navigation. [#1067](https://github.com/bugsnag/bugsnag-js/pull/1067)

## 7.4.0 (2020-10-01)

### Added

- (browser): Attach an anonymous device ID to error reports and sessions when the new `generateAnonymousId` option is enabled. [#1072](https://github.com/bugsnag/bugsnag-js/pull/1072)

### Changed

- (react-native): Allow plugins to be set in the JS layer. [#1064](https://github.com/bugsnag/bugsnag-js/pull/1064)
- (expo): Add support for Expo SDK v39 [#1052](https://github.com/bugsnag/bugsnag-js/pull/1052)
- (react-native): Update bugsnag-cocoa to v6.1.7 [#1081](https://github.com/bugsnag/bugsnag-js/pull/1081)
    - Re-enabled the `Require Only App-Extension-Safe API` build setting [bugsnag-cocoa#823](https://github.com/bugsnag/bugsnag-cocoa/pull/823)
    - Fix reporting of events with more than one error [bugsnag-cocoa#821](https://github.com/bugsnag/bugsnag-cocoa/pull/821)
    - Fix crash-on-launch (attempt to insert into immutable dictionary). [bugsnag-cocoa#819](https://github.com/bugsnag/bugsnag-cocoa/pull/819)
    - Add `+[Bugsnag breadcrumbs]` to allow apps to fetch the list of breadcrumbs. [bugsnag-cocoa#813](https://github.com/bugsnag/bugsnag-cocoa/pull/813)
    - Disable JSON pretty-printing in KSCrash reports to save disk space and bandwidth. [bugsnag-cocoa#802](https://github.com/bugsnag/bugsnag-cocoa/pull/802)
    - Fix reporting of Mach exception code and subcode. [bugsnag-cocoa#806](https://github.com/bugsnag/bugsnag-cocoa/pull/806)
    - Create date formatters at init time to avoid potential race conditions. [bugsnag-cocoa#807](https://github.com/bugsnag/bugsnag-cocoa/pull/807)
    - Refactor OOM handler to be less suceptible to data loss on crash. [bugsnag-cocoa#804](https://github.com/bugsnag/bugsnag-cocoa/pull/804)
- (react-native): Update bugsnag-android to v5.2.1 [#1080](https://github.com/bugsnag/bugsnag-js/pull/1080)
    - Support changing Event's api key in OnErrorCallback [bugsnag-android#928](https://github.com/bugsnag/bugsnag-android/pull/928)
    - Ensure device ID is set separately to the user ID [bugsnag-android#939](https://github.com/bugsnag/bugsnag-android/pull/939)
    - Improve stack traces and grouping for promise rejections on React Native < 0.63.2 [bugsnag-android#940](https://github.com/bugsnag/bugsnag-android/pull/940)
    - Prevent ConcurrentModificationException thrown from Metadata class [bugsnag-android#935](https://github.com/bugsnag/bugsnag-android/pull/935)
    - Prevent incorrect merge of nested maps in metadata [bugsnag-android#936](https://github.com/bugsnag/bugsnag-android/pull/936)
    - Improve stack traces and grouping for React Native promise rejections [bugsnag-android#937](https://github.com/bugsnag/bugsnag-android/pull/937)

## 7.3.5 (2020-09-16)

### Fixed

- (react-native): Update bugsnag-cocoa to 6.1.4. Fixes: Copy the metadata observer list rather than mutating it directly. [#1048](https://github.com/bugsnag/bugsnag-js/pull/1048)

## 7.3.4 (2020-09-10)

### Fixed

- (react-native): Suppress unchecked cast warnings for React Native Android [#1027](https://github.com/bugsnag/bugsnag-js/pull/1027)
- (react-native): Provide proguard rules to ensure reflection works on minified/obfuscated Android builds [#1030](https://github.com/bugsnag/bugsnag-js/pull/1030)

### Removed

- (react-native): Remove unnecessary log on iOS [#1028](https://github.com/bugsnag/bugsnag-js/pull/1028)

## 7.3.3 (2020-08-26)

### Added

- (plugin-react): Make type definitions `BugsnagErrorBoundary` and `BugsnagPluginReactResult` available for external use. [934](https://github.com/bugsnag/bugsnag-js/pull/934) / [#1009](https://github.com/bugsnag/bugsnag-js/pull/1009)

### Changed

- Use a peer dependency on @bugsnag/core in plugins [#1012](https://github.com/bugsnag/bugsnag-js/pull/1012)

### Fixed

- (expo): Ensure type definitions allow config to be supplied without an `apiKey`, as it may be supplied in `app.json` instead. [#1010](https://github.com/bugsnag/bugsnag-js/pull/1010)
- (plugin-angular): Update bundles and package entrypoints to support the Ivy renderer. [#994](https://github.com/bugsnag/bugsnag-js/pull/994)
- (react-native): Add `codeBundleId` to config type definition. [#1011](https://github.com/bugsnag/bugsnag-js/pull/1011)

## 7.3.2 (2020-08-17)

### Fixed

- (react-native): Ensure type definitions are included the @bugsnag/react-native package. [#1002](https://github.com/bugsnag/bugsnag-js/pull/1002)

## 7.3.1 (2020-08-11)

### Fixed

- (plugin-react): Reinstate updated code after a bad merge on the type definitions. [#987](https://github.com/bugsnag/bugsnag-js/pull/987)

## 7.3.0 (2020-08-10)

As of this version, this repo contains our brand new notifier for React Native `@bugsnag/react-native`. See the [docs](https://docs.bugsnag.com/platforms/react-native/react-native) and [upgrade guide](packages/react-native/UPGRADING.md) for more info.

Some minor internal changes to shared code were made to support the new notifier, but no external changes are required for existing `@bugsnag/js` or `@bugsnag/expo` users to upgrade to this version.

## 7.2.1 (2020-07-22)

### Fixed

- (plugin-vue): Ensure the `window.Vue` fallback does not throw in environments where `window` is undefined. [#928](https://github.com/bugsnag/bugsnag-js/pull/928)
- (plugin-react): Ensure the `window.React` fallback does not throw in environments where `window` is undefined. [#930](https://github.com/bugsnag/bugsnag-js/pull/930)
- (types): Use `Record<string,string>` instead of `object` for the `stackframe.code` property on events. [#929](https://github.com/bugsnag/bugsnag-js/pull/929)

## 7.2.0 (2020-07-06)

### Added

- (browser|node) Record the length of time the app has been running when an error occurs [#881](https://github.com/bugsnag/bugsnag-js/pull/881)
- (plugin-browser-device): Add device orientation to error reports [#881](https://github.com/bugsnag/bugsnag-js/pull/881)
- (plugin-expo-device): Add device manufacturer and model name for non-iOS devices to error reports [#881](https://github.com/bugsnag/bugsnag-js/pull/881)
- (plugin-expo-device): Add total memory to error reports [#881](https://github.com/bugsnag/bugsnag-js/pull/881)
- (plugin-node-device): Add OS name, OS version, total memory and free memory to error reports [#881](https://github.com/bugsnag/bugsnag-js/pull/881)

### Changed

- Update `@bugsnag/safe-json-stringify` to make `redactedKeys` case insensitive when using strings [#905](https://github.com/bugsnag/bugsnag-js/pull/905)
- (expo): Add support for Expo SDK v38 [#781](https://github.com/bugsnag/bugsnag-js/pull/890)

### Fixed
- (plugin-express): Ensure `req.body` is always present in metadata by collecting it at the last possible moment [#872](https://github.com/bugsnag/bugsnag-js/pull/872)

## 7.1.1 (2020-05-26)

### Fixed

- (plugin-express): Use import syntax that works without TypeScript's `esModuleInterop` compiler flag [#866](https://github.com/bugsnag/bugsnag-js/pull/866)
- (expo-cli): Ensure version detection logic for @bugsnag/expo works after v7.0.0 [#865](https://github.com/bugsnag/bugsnag-js/pull/865)
- (core): Ensure callbacks supplied in config permit functions with no named arguments [#863](https://github.com/bugsnag/bugsnag-js/pull/863)


## 7.1.0 (2020-05-21)

This update contains some substantial changes to plugin type definitions. If you are using TypeScript alongside a framework, you may need to make changes to your app. Please refer to the [upgrade guide](./UPGRADING.md).

### Changed

- (plugin-react|plugin-vue): Support late passing of framework reference [#839](https://github.com/bugsnag/bugsnag-js/pull/839)

### Added

- (plugin-react): Add type definitions for `Bugsnag.getPlugin('react')` [#839](https://github.com/bugsnag/bugsnag-js/pull/839)
- (plugin-vue): Add type definitions for `Bugsnag.getPlugin('vue')` [#839](https://github.com/bugsnag/bugsnag-js/pull/839)
- (plugin-react): Add `clearError` prop to `ErrorBoundary` [#797](https://github.com/bugsnag/bugsnag-js/pull/797)
- (plugin-express|plugin-koa|plugin-restify): Add full type definitions for plugins [#853](https://github.com/bugsnag/bugsnag-js/pull/853)

## 7.0.2 (2020-05-12)

### Fixed

- (types): Correct `init` static method name to `start` [#847](https://github.com/bugsnag/bugsnag-js/pull/847)

## 7.0.1 (2020-04-27)

### Fixed
- (plugin-vue): Fix plugin type definitions [#809](https://github.com/bugsnag/bugsnag-js/pull/809)
- (delivery-expo): Ensure Expo delivery logs event details correctly (instead of `undefined`) [#804](https://github.com/bugsnag/bugsnag-js/pull/804)
- (expo-cli): Ensure Expo cli inserts correct code depending on the version of the notifier [#808](https://github.com/bugsnag/bugsnag-js/pull/808)
- (expo): Ensure types allow `.start()` with no arguments [#817](https://github.com/bugsnag/bugsnag-js/pull/817)

## 7.0.0 (2020-04-14)

### Added
- Add `onBreadcrumb` and `onSession` callbacks. [#665](https://github.com/bugsnag/bugsnag-js/pull/665)
- Add `pauseSession()` and `resumeSession()` methods to `Client` [#666](https://github.com/bugsnag/bugsnag-js/pull/666)
- Add static `Bugsnag` client interface [#685](https://github.com/bugsnag/bugsnag-js/pull/685)
- Add `getUser()` and `setUser()` methods to `Session` [#692](https://github.com/bugsnag/bugsnag-js/pull/692)

### Changed
- Migrate lint tooling to ESLint for both .js and .ts source files [#644](https://github.com/bugsnag/bugsnag-js/pull/644)
- Rename `autoNotify` -> `autoDetectErrors`, and add `enabledErrorTypes` option for granularity [#706](https://github.com/bugsnag/bugsnag-js/pull/706)
- Rename `autoCaptureSessions` -> `autoTrackSessions` and simplify validation logic [#647](https://github.com/bugsnag/bugsnag-js/pull/647)
- Rename `report` to `event` [#646](https://github.com/bugsnag/bugsnag-js/pull/646)
- Rename `notifyReleaseStages` -> `enabledReleaseStages` [#649](https://github.com/bugsnag/bugsnag-js/pull/649)
- Rename `beforeSend` -> `onError`, remove `event.ignore()` and refactor callback logic [#654](https://github.com/bugsnag/bugsnag-js/pull/654)
- Update signature of `notify(err, opts?, cb?)` -> `notify(err, onError?, cb?)` for a canonical way to update events [#655](https://github.com/bugsnag/bugsnag-js/pull/655)
- Simplify client configuration, and store resulting config privately [#656](https://github.com/bugsnag/bugsnag-js/pull/656)
- User is now stored privately on `client` and `event` and updated via get/set methods [#657](https://github.com/bugsnag/bugsnag-js/pull/657)
- Remove individual breadcrumb flags in favour of `enabledBreadcrumbTypes`, rename `breadcrumb.{ name -> message, metaData -> metadata }`, and update `leaveBreadcrumb()` type signature to be more explicit [#650](https://github.com/bugsnag/bugsnag-js/pull/650)
- Rename `metaData` -> `metadata` and add consistent `add/get/clearMetadata()` methods to `Client`/`Event` for manipulating metadata explicitly, rather than mutating a property [#658](https://github.com/bugsnag/bugsnag-js/pull/658)
- Update `leaveBreadcrumb()` type signature to return `void`. [#661](https://github.com/bugsnag/bugsnag-js/pull/661)
- Refactor `notify()` to not accept events (they go via `_notify()` instead). Consolidate `Event` static methods into a single `.create()` utility, used by all automatic error detection components. [#664](https://github.com/bugsnag/bugsnag-js/pull/664)
- Stop applying default error class/message when none is supplied [#676](https://github.com/bugsnag/bugsnag-js/pull/676)
- Remove Bugsnag* prefix from internal class names [#679](https://github.com/bugsnag/bugsnag-js/pull/679)
- Rename and make private the `Session` method `trackError()` -> `_track()` [#675](https://github.com/bugsnag/bugsnag-js/pull/675)
- Update `Event` to support multiple errors [#680](https://github.com/bugsnag/bugsnag-js/pull/680)
- Move context to a private property on `Client`, and get/set via `getContext()/setContext()` [#681](https://github.com/bugsnag/bugsnag-js/pull/681)
- Update `@bugsnag/safe-json-stringify` to replace redacted values with `[REDACTED]` [#683](https://github.com/bugsnag/bugsnag-js/pull/683)
- Update `collectUserIp` option to use `[REDACTED]` instead of `[NOT COLLECTED]` for consistency [#743](https://github.com/bugsnag/bugsnag-js/pull/743)
- Refactor type definitions [#682](https://github.com/bugsnag/bugsnag-js/pull/682)
- Ensure automatic context is not used when `setContext(null)` has been called [#694](https://github.com/bugsnag/bugsnag-js/pull/694)
- Rename `filters` option to `redactedKeys` [#704](https://github.com/bugsnag/bugsnag-js/pull/704)
- Rename `device.modelName` to `device.model` [#726](https://github.com/bugsnag/bugsnag-js/pull/726)
- Rename `client.refresh()` to `client.resetEventCount()` [#727](https://github.com/bugsnag/bugsnag-js/pull/727)
- `client.use(plugin)` has been removed and plugins must now be passed in to configuration [#759](https://github.com/bugsnag/bugsnag-js/pull/759)
- Invalid configuration (except for `apiKey`) now falls back to default values rather than throwing an error [#759](https://github.com/bugsnag/bugsnag-js/pull/759)

### Removed
- Remove non-public methods from `Client` interface: `logger()`, `delivery()` and `sessionDelegate()` [#659](https://github.com/bugsnag/bugsnag-js/pull/659)
- Remove `client.request` property [#672](https://github.com/bugsnag/bugsnag-js/pull/672)
- Remove `client.device` property [#673](https://github.com/bugsnag/bugsnag-js/pull/673)
- Remove `client.app` property [#677](https://github.com/bugsnag/bugsnag-js/pull/677)
- Move breadcrumbs to a private property on `client._breadcrumbs` [#681](https://github.com/bugsnag/bugsnag-js/pull/681)

## 6.6.1 (2020-04-03)

### Fix

- (expo): Ensure Expo packages that depend on `NetInfo` have their versions locked [#796](https://github.com/bugsnag/bugsnag-js/pull/796)
- (expo-cli): Update Expo versions installed by the cli [#796](https://github.com/bugsnag/bugsnag-js/pull/796)

Note, alongside this release, additional patches were made to previous minor versions of `@bugsnag/expo`: `6.5.3` and `6.4.4`. This is to ensure the correct version of `NetInfo` is depended on for SDK versions 36 and 34 respectively.

## 6.6.0 (2020-04-02)

### Changed

- (expo): Add support for Expo SDK v37 [#781](https://github.com/bugsnag/bugsnag-js/pull/781)

## 6.5.2 (2020-02-05)

### Changed

- (node): Use `util.inspect()` on plain object errors when logging their value [#696](https://github.com/bugsnag/bugsnag-js/pull/696)

### Fixed

- (delivery-x-domain-request): Correct `this`->`client` reference when attempting to log an error [#722](https://github.com/bugsnag/bugsnag-js/pull/722)

## 6.5.1 (2020-01-08)

### Fixed
- (expo): Pin `@react-native-community/netinfo` dependency to exact version bundled by Expo [#691](https://github.com/bugsnag/bugsnag-js/pull/691)
- (plugin-express), (plugin-restify): Send request metadata as the correct `notify()` parameter [#687](https://github.com/bugsnag/bugsnag-js/pull/687)

## 6.5.0 (2019-12-16)

### Added
- (expo): Add support for breaking changes in Expo SDK v36 [#670](https://github.com/bugsnag/bugsnag-js/pull/670)
- (expo-cli): Choose a compatible version of @bugnsnag/expo for SDK v33-35 [#670](https://github.com/bugsnag/bugsnag-js/pull/670)

### Fixed
- (plugin-network-breadcrumbs): Fixes the `window.fetch` monkey-patch to also accept `Request`. [#662](https://github.com/bugsnag/bugsnag-js/pull/662)

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
