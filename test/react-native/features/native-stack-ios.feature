@ios_only
Feature: Native stacktrace is parsed for promise rejections

# Skipped on New Arch below 0.74 - see PLAT-12193
@skip_new_arch_below_074
Scenario: Handled native promise rejection with native stacktrace
  When I run "NativePromiseRejectionHandledScenario"
  Then I wait to receive an error
  And the event "unhandled" is false
  And the error payload field "events.0.exceptions" is an array with 1 elements
  And the event "exceptions.0.errorClass" equals "Error"
  And the event "exceptions.0.message" equals "NativePromiseRejectionHandledScenario"
  And the event "exceptions.0.type" equals "reactnativejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array

  # the native part of the stack comes first
  And the error payload field "events.0.exceptions.0.stacktrace.0.frameAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoFile" equals one of:
    | reactnative |
    | React       | 
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoLoadAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoUUID" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoVMAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.method" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.symbolAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.type" equals "cocoa"

  # the javascript part follows
  # On New Arch there is no JS stacktrace - see PLAT-12193
  # We're check the method: asyncGeneratorStep
  And the event "exceptions.0.stacktrace.21.columnNumber" equals the version-dependent string:
  | arch | version | value                   |
  | new  | default | @skip                   |
  | old  | default | @not_null               |
  And the event "exceptions.0.stacktrace.21.file" equals the version-dependent string:
  | arch | version | value                   |
  | new  | default | @skip                   |
  | old  | default | @not_null               |
  And the event "exceptions.0.stacktrace.21.lineNumber" equals the version-dependent string:
  | arch | version | value                   |
  | new  | default | @skip                   |
  | old  | default | @not_null               |
  And the event "exceptions.0.stacktrace.21.type" equals the version-dependent string:
  | arch | version | value                   |
  | new  | default | @skip                   |
  | old  | default | @null                   |

# Skipped on New Arch below 0.74 - see PLAT-12193
@skip_new_arch_below_074
Scenario: Unhandled native promise rejection with native stacktrace
  When I run "NativePromiseRejectionUnhandledScenario"
  Then I wait to receive an error
  And the event "unhandled" is true
  And the event "exceptions.0.errorClass" equals "Error"
  And the event "exceptions.0.message" equals "NativePromiseRejectionUnhandledScenario"
  And the event "exceptions.0.type" equals "reactnativejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array

  # the native part of the stack comes first
  And the error payload field "events.0.exceptions.0.stacktrace.0.frameAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoFile" equals one of:
    | reactnative |
    | React       | 
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoLoadAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoUUID" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoVMAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.method" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.symbolAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.type" equals "cocoa"

  # the javascript part follows
  # On New Arch there is no JS stacktrace - see PLAT-12193
  # We're check the method: asyncGeneratorStep
  And the event "exceptions.0.stacktrace.21.columnNumber" equals the version-dependent string:
  | arch | version | value                   |
  | new  | default | @skip                   |
  | old  | default | @not_null               |
  And the event "exceptions.0.stacktrace.21.file" equals the version-dependent string:
  | arch | version | value                   |
  | new  | default | @skip                   |
  | old  | default | @not_null               |
  And the event "exceptions.0.stacktrace.21.lineNumber" equals the version-dependent string:
  | arch | version | value                   |
  | new  | default | @skip                   |
  | old  | default | @not_null               |
  And the event "exceptions.0.stacktrace.21.type" equals the version-dependent string:
  | arch | version | value                   |
  | new  | default | @skip                   |
  | old  | default | @null                   |

@skip_old_arch @skip_new_arch_below_074
Scenario: Unhandled synchronous turbo module exception with native stacktrace
  When I run "UnhandledNativeErrorSyncScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledNativeErrorSyncScenario"
  Then I wait to receive an error
  And the event "unhandled" is true

  # First exception is the JS Error with JS stacktrace
  And the event "exceptions.0.errorClass" equals "Error"
  And the event "exceptions.0.message" equals the version-dependent string:
  | arch | version | value                                                                                  |
  | new  | 0.74    | Exception in HostFunction: UnhandledNativeErrorScenario                                |
  | new  | default | BugsnagTestInterface.runScenarioSync raised an exception: UnhandledNativeErrorScenario |

  And the event "exceptions.0.type" equals "reactnativejs"
  And the event "exceptions.0.stacktrace.0.method" equals "runScenarioSync"
  And the event "exceptions.0.stacktrace.0.file" equals "(native)"
  And the event "exceptions.0.stacktrace.1.method" equals "run"
  And the error payload field "events.0.exceptions.0.stacktrace.1.file" matches the regex "main\.jsbundle$"

  # Second exception (cause) is the native exception with native stacktrace
  And the event "exceptions.1.errorClass" equals "NSException"
  And the event "exceptions.1.message" equals "UnhandledNativeErrorScenario"
  And the event "exceptions.1.type" equals "reactnativejs"
  And each element in error payload field "events.0.exceptions.1.stacktrace" has "frameAddress"
  And each element in error payload field "events.0.exceptions.1.stacktrace" has "machoFile"
  And each element in error payload field "events.0.exceptions.1.stacktrace" has "machoLoadAddress"
  And each element in error payload field "events.0.exceptions.1.stacktrace" has "machoUUID"
  And each element in error payload field "events.0.exceptions.1.stacktrace" has "machoVMAddress"
  And each element in error payload field "events.0.exceptions.1.stacktrace" has "symbolAddress"
