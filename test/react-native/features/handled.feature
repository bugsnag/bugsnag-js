Feature: Reporting handled errors

Scenario: Calling notify() with a caught Error
  When I run "HandledCaughtErrorScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "HandledCaughtError"

Scenario: Native notify() with a caught Error
  When I run "HandledNativeErrorScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "java.lang.RuntimeException"
  And the exception "message" equals "HandledExceptionScenario"
