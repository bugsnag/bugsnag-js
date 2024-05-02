Feature: Tests for running a React Native app that was initialized using the Bugsnag React Native CLI

@ios_only # Skip this feature on Android until issue with Selenium and BitBar has been resolved PLAT-11897
Scenario: A built, CLI initialized, app sends JavaScript and Native handled errors
  When I wait to receive at least 1 session
  Then the session is valid for the session reporting API version "1.0" for the React Native notifier

  And I notify a handled JavaScript error
  And I wait to receive an error
  Then the event "unhandled" is false
  And the event "exceptions.0.errorClass" equals "ReferenceError"
  And the exception "type" equals "reactnativejs"
  And I discard the oldest error

  And I notify a handled native error
  And I wait to receive an error
  Then the event "unhandled" is false
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
    | android | java.lang.Exception |
    | ios     | NSError             |
