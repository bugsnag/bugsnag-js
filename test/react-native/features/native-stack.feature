Feature: Native stack

Scenario: Handled JS error
  When I run "NativeStackHandledScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "NativeStackHandledScenario"
  And the event "unhandled" is false
  # And the payload field "events.0.exceptions" is an array with 2 elements
  # And the event "exceptions.1.stacktrace.0.file" equals the platform-dependent string: 
  # | android | Scenario.kt                 |
  # | ios     | IOS_VALUE_REPLACE_ME        |

Scenario: Unhandled JS error
  When I run "NativeStackUnhandledScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "NativeStackUnhandledScenario"
  And the event "unhandled" is true
  # And the payload field "events.0.exceptions" is an array with 2 elements
  # And the event "exceptions.1.stacktrace.0.file" equals the platform-dependent string: 
  # | android | Scenario.kt                 |
  # | ios     | IOS_VALUE_REPLACE_ME        |