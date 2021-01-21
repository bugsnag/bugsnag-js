# Bugsnag exception reporter for iOS and macOS
[![iOS Documentation](https://img.shields.io/badge/ios_documentation-latest-blue.svg)](http://docs.bugsnag.com/platforms/ios/)
[![tvOS Documentation](https://img.shields.io/badge/tvos_documentation-latest-blue.svg)](http://docs.bugsnag.com/platforms/tvos/)
[![macOS Documentation](https://img.shields.io/badge/macos_documentation-latest-blue.svg)](http://docs.bugsnag.com/platforms/macos/)
[![Build status](https://badge.buildkite.com/bc15523ca2dc56d1a9fd61a1c0e93b99adba62f229a1c3379b.svg?branch=master)](https://buildkite.com/bugsnag/bugsnag-cocoa)

The Bugsnag crash reporter for Cocoa library automatically detects crashes and fatal signals in your iOS 9.3+, macOS 10.11+ and tvOS 9.2+ applications, collecting diagnostic information and immediately notifying your development team, helping you to understand and resolve issues as fast as possible. Learn more about [iOS crash reporting with Bugsnag](https://www.bugsnag.com/platforms/ios-crash-reporting/).

## Features

* Automatically report unhandled exceptions and crashes
* Report handled exceptions
* Log breadcrumbs which are attached to crash reports and add insight to users' actions
* Attach user information and custom diagnostic data to determine how many people are affected by a crash


## Getting started

### iOS

1. [Create a Bugsnag account](https://bugsnag.com)
1. Complete the instructions in the integration guide for [iOS](http://docs.bugsnag.com/platforms/ios/)
1. Report handled exceptions using [`[Bugsnag notify:]`](http://docs.bugsnag.com/platforms/ios/reporting-handled-exceptions/)
1. Customize your integration using the [configuration options](http://docs.bugsnag.com/platforms/ios/configuration-options/)

### macOS

1. [Create a Bugsnag account](https://bugsnag.com)
1. Complete the instructions in the integration guide for [macOS](http://docs.bugsnag.com/platforms/macos/)
1. Report handled exceptions using [`[Bugsnag notify:]`](http://docs.bugsnag.com/platforms/macos/reporting-handled-exceptions/)
1. Customize your integration using the [configuration options](http://docs.bugsnag.com/platforms/macos/configuration-options/)

## Support

* Read the [iOS](http://docs.bugsnag.com/platforms/ios/configuration-options) or [macOS](http://docs.bugsnag.com/platforms/macos/configuration-options) configuration reference
* [Search open and closed issues](https://github.com/bugsnag/bugsnag-cocoa/issues?utf8=✓&q=is%3Aissue) for similar problems
* [Report a bug or request a feature](https://github.com/bugsnag/bugsnag-cocoa/issues/new)


## Contributing

All contributors are welcome! For information on how to build, test,
and release `bugsnag-cocoa`, see our
[contributing guide](https://github.com/bugsnag/bugsnag-cocoa/blob/master/CONTRIBUTING.md).


## License

The Bugsnag Cocoa library is free software released under the MIT License.
See [LICENSE.txt](https://github.com/bugsnag/bugsnag-cocoa/blob/master/LICENSE.txt)
for details.
