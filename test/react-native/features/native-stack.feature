Feature: Native stacktrace is parsed for promise rejections

@android_only
Scenario: Handled JS error with native stacktrace
  When I run "NativeStackHandledScenario"
  Then I wait to receive an error
  And the event "unhandled" is false
  And the error payload field "events.0.exceptions" is an array with 1 elements
  And the event "exceptions.0.errorClass" equals "Error"
  And the event "exceptions.0.message" equals "NativeStackHandledScenario"
  And the event "exceptions.0.type" equals "reactnativejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array

  # the native part of the stack comes first
  And the error payload field "events.0.exceptions.0.stacktrace.0.type" equals "android"
  And the error payload field "events.0.exceptions.0.stacktrace.0.file" equals "Scenario.kt"
  And the error payload field "events.0.exceptions.0.stacktrace.0.method" equals one of:
    | com.reactnative.scenarios.Scenario.generateException |
    | generateException |
  And the error payload field "events.0.exceptions.0.stacktrace.1.method" equals one of:
    | com.reactnative.scenarios.NativeStackHandledScenario.run |
    | run |
  And the error payload field "events.0.exceptions.0.stacktrace.2.method" equals one of:
    | com.reactnative.module.BugsnagModule.runScenario |
    | runScenario |

  # the javascript part follows
  # on RN 0.60 there are 10 native stackframes, on 0.63 there are 13
  And the error payload field "events.0.exceptions.0.stacktrace.13.columnNumber" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.13.file" equals "index.android.bundle"
  And the error payload field "events.0.exceptions.0.stacktrace.13.lineNumber" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.13.type" is null

@android_only
Scenario: Unhandled JS error with native stacktrace
  When I run "NativeStackUnhandledScenario"
  Then I wait to receive an error
  And the event "unhandled" is true
  And the event "exceptions.0.errorClass" equals "Error"
  And the event "exceptions.0.message" equals "NativeStackUnhandledScenario"
  And the event "exceptions.0.type" equals "reactnativejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array

  # the native part of the stack comes first
  And the error payload field "events.0.exceptions.0.stacktrace.0.type" equals "android"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array
  And the error payload field "events.0.exceptions.0.stacktrace.0.file" equals "Scenario.kt"
  And the error payload field "events.0.exceptions.0.stacktrace.1.file" equals "NativeStackUnhandledScenario.kt"
  And the error payload field "events.0.exceptions.0.stacktrace.2.file" equals "BugsnagModule.java"
  And the error payload field "events.0.exceptions.0.stacktrace.0.method" equals one of:
    | com.reactnative.scenarios.Scenario.generateException |
    | generateException |
  And the error payload field "events.0.exceptions.0.stacktrace.1.method" equals one of:
    | com.reactnative.scenarios.NativeStackUnhandledScenario.run |
    | run |
  And the error payload field "events.0.exceptions.0.stacktrace.2.method" equals one of:
    | com.reactnative.module.BugsnagModule.runScenario |
    | runScenario |

  # the javascript part follows
  # on RN 0.60 there are 10 native stackframes, on 0.63 there are 13
  And the error payload field "events.0.exceptions.0.stacktrace.13.columnNumber" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.13.file" equals "index.android.bundle"
  And the error payload field "events.0.exceptions.0.stacktrace.13.lineNumber" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.13.type" is null

#   # PLAT-5117 addresses float serialization
#   And the error payload field "events.0.exceptions.1.stacktrace.0.lineNumber" equals 1
#   And the error payload field "events.0.exceptions.1.stacktrace.1.lineNumber" equals 1
#   And the error payload field "events.0.exceptions.1.stacktrace.2.lineNumber" equals 2

@skip
@ios_only
Scenario: Handled JS error with native stacktrace
  When I run "NativeStackHandledScenario"
  Then I wait to receive an error
  And the event "unhandled" is false
  And the error payload field "events.0.exceptions" is an array with 1 elements
  And the event "exceptions.0.errorClass" equals "Error"
  And the event "exceptions.0.message" equals "NativeStackHandledScenario"
  And the event "exceptions.0.type" equals "reactnativejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array

  # the native part of the stack comes first
  And the error payload field "events.0.exceptions.0.stacktrace.0.frameAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.isLR" is null
  And the error payload field "events.0.exceptions.0.stacktrace.0.isPC" is true
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoFile" equals "reactnative"
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoLoadAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoUUID" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoVMAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.method" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.symbolAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.type" equals "cocoa"

  # the javascript part follows
  And the error payload field "events.0.exceptions.0.stacktrace.20.columnNumber" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.20.file" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.20.lineNumber" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.20.type" is null

@ios_only
Scenario: Unhandled JS error with native stacktrace
  When I run "NativeStackUnhandledScenario"
  Then I wait to receive an error
  And the event "unhandled" is true
  And the event "exceptions.0.errorClass" equals "Error"
  And the event "exceptions.0.message" equals "NativeStackUnhandledScenario"
  And the event "exceptions.0.type" equals "reactnativejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array

  # the native part of the stack comes first
  And the error payload field "events.0.exceptions.0.stacktrace.0.frameAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.isLR" is null
  And the error payload field "events.0.exceptions.0.stacktrace.0.isPC" is true
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoFile" equals "reactnative"
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoLoadAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoUUID" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.machoVMAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.method" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.symbolAddress" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.0.type" equals "cocoa"

  # the javascript part follows
  And the error payload field "events.0.exceptions.0.stacktrace.20.columnNumber" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.20.file" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.20.lineNumber" is not null
  And the error payload field "events.0.exceptions.0.stacktrace.20.type" is null
