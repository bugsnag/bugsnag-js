Feature: Reporting unhandled errors

Background:
  Given the element "unhandled" is present
  And I click the element "unhandled"

Scenario: Catching an Unhandled error
  Given the element "unhandledErrorButton" is present
  When I click the element "unhandledErrorButton"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UnhandledError"
  And the error Bugsnag-Integrity header is valid

Scenario: Catching an Unhandled promise rejection
  Given the element "unhandledPromiseRejectionButton" is present
  When I click the element "unhandledPromiseRejectionButton"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UnhandledPromiseRejection"
  And the error Bugsnag-Integrity header is valid
