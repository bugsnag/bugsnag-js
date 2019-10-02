Feature: Reporting handled errors

Scenario: Calling notify() with a caught Error
  When I run "HandledCaughtErrorScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "HandledCaughtError"