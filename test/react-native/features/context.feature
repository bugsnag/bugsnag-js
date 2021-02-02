Feature: Context

Scenario: JS default context
  When I run "ContextJsDefaultScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "ContextJsDefaultScenario"
  And the event "unhandled" is false
  And the event "context" is null

Scenario: JS custom context
  When I run "ContextJsCustomScenario"
  Then I wait to receive 3 errors
  And the following sets are present in the current error payloads:
    | events.0.exceptions.0.message | events.0.context | events.0.exceptions.0.errorClass |
    | ContextJsCustomScenarioA      | context-config   | Error                            |
    | ContextJsCustomScenarioB      | context-client   | Error                            |
    | ContextJsCustomScenarioC      | context-onerror  | Error                            |
  And the event "unhandled" is false
  Then I discard the oldest error
  And the event "unhandled" is false
  Then I discard the oldest error
  And the event "unhandled" is false

Scenario: Native custom context
  When I run "ContextNativeCustomScenario"
  Then I wait to receive 2 errors
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the event "unhandled" is false
  And the following sets are present in the current error payloads:
    | events.0.exceptions.0.message | events.0.context |
    | ContextNativeCustomScenario   | context-js       |
    | ContextNativeCustomScenario2  | context-native   |
  And I discard the oldest error
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the event "unhandled" is false
