Feature: Reporting handled errors

Background:
  Given the element "handled" is present
  And I click the element "handled"

Scenario: Calling notify() with an Error
  Given the element "handledErrorButton" is present
  When I click the element "handledErrorButton"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "HandledError"
  And the exception "type" equals "expojs"
  And the error Bugsnag-Integrity header is valid

Scenario: Calling notify() with a caught Error
  Given the element "handledCaughtErrorButton" is present
  When I click the element "handledCaughtErrorButton"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "HandledCaughtError"
  And the exception "type" equals "expojs"
  And the error Bugsnag-Integrity header is valid
