Feature: Tests for running a React Native app that was initialized using the Bugsnag React Native CLI

Scenario: A built, CLI initialized, app sends sessions and errors
  When I wait to receive at least 1 session
  Then the session is valid for the session reporting API version "1.0" for the React Native notifier

  And I wait to receive an error
  Then the exception "errorClass" equals "Error"
  And the exception "message" equals "CLI Test Error"
  And the exception "type" equals "reactnativejs"
  And the event "unhandled" is false
