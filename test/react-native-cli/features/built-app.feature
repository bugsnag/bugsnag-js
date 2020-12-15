Feature: Tests against a React Native app that was initialized using the Bugsnag React Native CLI

Scenario: Build app sends JavaScript and Native handled errors
  When I wait to receive a request
  And the request is valid for the session reporting API version "1.0" for the React Native notifier
  And I discard the oldest request


  And I notify a handled JavaScript error
  And I wait to receive a request
  Then the event "unhandled" is false
  And the event "exceptions.0.errorClass" equals "ReferenceError"
  And the exception "type" equals "reactnativejs"
  And I discard the oldest request

  And I notify a handled native error
  And I wait to receive a request
  And the event "unhandled" is false
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
    | android | java.lang.Exception |
    | ios     | NSError             |
