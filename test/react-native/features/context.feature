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
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "ContextJsCustomScenarioA"
  And the event "unhandled" is false
  And the event "context" equals "context-config"
  And I discard the oldest request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "ContextJsCustomScenarioB"
  And the event "unhandled" is false
  And the event "context" equals "context-client"
  And I discard the oldest request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "ContextJsCustomScenarioC"
  And the event "unhandled" is false
  And the event "context" equals "context-onerror"

Scenario: Native custom context
  When I run "ContextNativeCustomScenario"
  Then I wait to receive 2 requests
  And the exception "errorClass" equals "java.lang.RuntimeException"
  And the exception "message" equals "ContextNativeCustomScenario"
  And the event "unhandled" is false
  And the event "context" equals "context-js"
  And I discard the oldest request
  And the exception "errorClass" equals "java.lang.RuntimeException"
  And the exception "message" equals "ContextNativeCustomScenario"
  And the event "unhandled" is false
  And the event "context" equals "context-native"
