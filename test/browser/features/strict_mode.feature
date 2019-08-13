@strict_mode
Feature: Compatibility with strict mode

Scenario: notifier does not error in strict mode
  When I navigate to the URL "/strict_mode/script/a.html"
  And the test should run in this browser
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "Bugsnag usage error. notify() expected error/opts parameters, got unsupported object"
