Feature: Reporting handled errors

Scenario: calling notify() with Error
  Given the element "handledErrorButton" is present
  When I click the element "handledErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "HandledError"

Scenario: calling notify() with a caught Error
  Given the element "handledCaughtErrorButton" is present
  When I click the element "handledCaughtErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "HandledCaughtError"