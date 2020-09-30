# Feature: Native stacktrace is parsed for promise rejections

# @android_only
# Scenario: Handled JS error with native stacktrace
#   When I run "NativeStackHandledScenario"
#   Then I wait to receive a request
#   And the event "unhandled" is false
#   And the payload field "events.0.exceptions" is an array with 2 elements
#   And the event "exceptions.0.errorClass" equals "Error"
#   And the event "exceptions.0.message" equals "NativeStackHandledScenario"
#   And the event "exceptions.0.type" equals "reactnativejs"
#   And the payload field "events.0.exceptions.0.stacktrace" is a non-empty array

#   # validate the native error
#   And the event "exceptions.1.errorClass" equals "Error"
#   And the event "exceptions.1.message" equals "NativeStackHandledScenario"
#   And the event "exceptions.1.type" equals "android"
#   And the payload field "events.0.exceptions.1.stacktrace" is a non-empty array
#   And the payload field "events.0.exceptions.1.stacktrace.0.file" equals "Scenario.kt"
#   And the payload field "events.0.exceptions.1.stacktrace.1.file" equals "NativeStackHandledScenario.kt"
#   And the payload field "events.0.exceptions.1.stacktrace.2.file" equals "BugsnagModule.java"
#   And the payload field "events.0.exceptions.1.stacktrace.0.method" equals one of:
#     | com.reactnative.scenarios.Scenario.generateException |
#     | generateException |
#   And the payload field "events.0.exceptions.1.stacktrace.1.method" equals one of:
#     | com.reactnative.scenarios.NativeStackHandledScenario.run |
#     | run |
#   And the payload field "events.0.exceptions.1.stacktrace.2.method" equals one of:
#     | com.reactnative.module.BugsnagModule.runScenario |
#     | runScenario |

#   # PLAT-5117 addresses float serialization
#   And the payload field "events.0.exceptions.1.stacktrace.0.lineNumber" equals 1
#   And the payload field "events.0.exceptions.1.stacktrace.1.lineNumber" equals 1
#   And the payload field "events.0.exceptions.1.stacktrace.2.lineNumber" equals 2

# @android_only
# Scenario: Unhandled JS error with native stacktrace
#   When I run "NativeStackUnhandledScenario"
#   Then I wait to receive a request
#   And the event "unhandled" is true
#   And the event "exceptions.0.errorClass" equals "Error"
#   And the event "exceptions.0.message" equals "NativeStackUnhandledScenario"
#   And the event "exceptions.0.type" equals "reactnativejs"
#   And the payload field "events.0.exceptions.0.stacktrace" is a non-empty array

#   # validate the native error
#   And the event "exceptions.1.errorClass" equals "Error"
#   And the event "exceptions.1.message" equals "NativeStackUnhandledScenario"
#   And the event "exceptions.1.type" equals "android"
#   And the payload field "events.0.exceptions.1.stacktrace" is a non-empty array
#   And the payload field "events.0.exceptions.1.stacktrace.0.file" equals "Scenario.kt"
#   And the payload field "events.0.exceptions.1.stacktrace.1.file" equals "NativeStackUnhandledScenario.kt"
#   And the payload field "events.0.exceptions.1.stacktrace.2.file" equals "BugsnagModule.java"
#   And the payload field "events.0.exceptions.1.stacktrace.0.method" equals one of:
#     | com.reactnative.scenarios.Scenario.generateException |
#     | generateException |
#   And the payload field "events.0.exceptions.1.stacktrace.1.method" equals one of:
#     | com.reactnative.scenarios.NativeStackUnhandledScenario.run |
#     | run |
#   And the payload field "events.0.exceptions.1.stacktrace.2.method" equals one of:
#     | com.reactnative.module.BugsnagModule.runScenario |
#     | runScenario |

#   # PLAT-5117 addresses float serialization
#   And the payload field "events.0.exceptions.1.stacktrace.0.lineNumber" equals 1
#   And the payload field "events.0.exceptions.1.stacktrace.1.lineNumber" equals 1
#   And the payload field "events.0.exceptions.1.stacktrace.2.lineNumber" equals 2

# @skip
# @ios_only
# Scenario: Handled JS error with native stacktrace
#   When I run "NativeStackHandledScenario"
#   Then I wait to receive a request
#   And the event "unhandled" is false
#   And the payload field "events.0.exceptions" is an array with 2 elements
#   And the event "exceptions.0.errorClass" equals "Error"
#   And the event "exceptions.0.message" equals "NativeStackHandledScenario"
#   And the event "exceptions.0.type" equals "reactnativejs"
#   And the payload field "events.0.exceptions.0.stacktrace" is a non-empty array

#   # validate the native error
#   And the event "exceptions.1.errorClass" equals "Error"
#   And the event "exceptions.1.message" equals "NativeStackHandledScenario"
#   And the event "exceptions.1.type" equals "cocoa"
#   And the payload field "events.0.exceptions.1.stacktrace" is a non-empty array
#   And the payload field "events.0.exceptions.1.stacktrace.0.method" is not null
#   And the payload field "events.0.exceptions.1.stacktrace.0.machoVMAddress" is not null
#   And the payload field "events.0.exceptions.1.stacktrace.0.machoFile" equals "reactnative"
#   And the payload field "events.0.exceptions.1.stacktrace.0.symbolAddress" is not null
#   And the payload field "events.0.exceptions.1.stacktrace.0.machoUUID" is not null
#   And the payload field "events.0.exceptions.1.stacktrace.0.machoLoadAddress" is not null
#   And the payload field "events.0.exceptions.1.stacktrace.0.frameAddress" is not null
#   And the payload field "events.0.exceptions.1.stacktrace.0.isPC" is true
#   And the payload field "events.0.exceptions.1.stacktrace.0.isLR" is null

# @ios_only
# Scenario: Unhandled JS error with native stacktrace
#   When I run "NativeStackUnhandledScenario"
#   Then I wait to receive a request
#   And the event "unhandled" is true
#   And the event "exceptions.0.errorClass" equals "Error"
#   And the event "exceptions.0.message" equals "NativeStackUnhandledScenario"
#   And the event "exceptions.0.type" equals "reactnativejs"
#   And the payload field "events.0.exceptions.0.stacktrace" is a non-empty array

#   # validate the native error
#   And the event "exceptions.1.errorClass" equals "Error"
#   And the event "exceptions.1.message" equals "NativeStackUnhandledScenario"
#   And the event "exceptions.1.type" equals "cocoa"
#   And the payload field "events.0.exceptions.1.stacktrace" is a non-empty array
#   And the payload field "events.0.exceptions.1.stacktrace.0.method" is not null
#   And the payload field "events.0.exceptions.1.stacktrace.0.machoVMAddress" is not null
#   And the payload field "events.0.exceptions.1.stacktrace.0.machoFile" equals "reactnative"
#   And the payload field "events.0.exceptions.1.stacktrace.0.symbolAddress" is not null
#   And the payload field "events.0.exceptions.1.stacktrace.0.machoUUID" is not null
#   And the payload field "events.0.exceptions.1.stacktrace.0.machoLoadAddress" is not null
#   And the payload field "events.0.exceptions.1.stacktrace.0.frameAddress" is not null
#   And the payload field "events.0.exceptions.1.stacktrace.0.isPC" is true
#   And the payload field "events.0.exceptions.1.stacktrace.0.isLR" is null
