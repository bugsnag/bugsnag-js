Feature: Reporting unhandled errors

Scenario: catching an Unhandled error
  Given the element "unhandledErrorButton" is present
  When I click the element "unhandledErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UnhandledError"