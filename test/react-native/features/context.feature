Feature: Context

Scenario: JS default context
  When I run "ContextJsDefaultScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "ContextJsDefaultScenario"
  And the event "unhandled" is false
  And the event "context" is null

Scenario: JS custom context
  When I run "ContextJsCustomScenario"
  Then I wait to receive 3 requests
  And the event "unhandled" is false
  And the exception "errorClass" equals "Error"
  And the payload fields match one of the following sets:
    | events.0.exceptions.0.message | events.0.context |
    | ContextJsCustomScenarioA      | context-config   |
    | ContextJsCustomScenarioB      | context-client   |
    | ContextJsCustomScenarioC      | context-onerror  |
  Then I discard the oldest request
  And the event "unhandled" is false
  And the exception "errorClass" equals "Error"
  And the payload fields match one of the following sets:
    | events.0.exceptions.0.message | events.0.context |
    | ContextJsCustomScenarioA      | context-config   |
    | ContextJsCustomScenarioB      | context-client   |
    | ContextJsCustomScenarioC      | context-onerror  |
  Then I discard the oldest request
  And the event "unhandled" is false
  And the exception "errorClass" equals "Error"
  And the payload fields match one of the following sets:
    | events.0.exceptions.0.message | events.0.context |
    | ContextJsCustomScenarioA      | context-config   |
    | ContextJsCustomScenarioB      | context-client   |
    | ContextJsCustomScenarioC      | context-onerror  |

Scenario: Native custom context
  When I run "ContextNativeCustomScenario"
  Then I wait to receive 2 requests
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the payload fields match one of the following sets:
    | events.0.exceptions.0.message | events.0.context |
    | ContextNativeCustomScenario   | context-js       |
    | ContextNativeCustomScenario2  | context-native   |
  And the event "unhandled" is false
  And I discard the oldest request
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the event "unhandled" is false
  And the payload fields match one of the following sets:
    | events.0.exceptions.0.message | events.0.context |
    | ContextNativeCustomScenario   | context-js       |
    | ContextNativeCustomScenario2  | context-native   |
