Feature: Reporting unhandled errors

Scenario: Catching an Unhandled error
  When I run "UnhandledJsErrorScenario" and relaunch the app
  And I configure Bugsnag for "UnhandledJsErrorScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UnhandledJsErrorScenario"

Scenario: Catching an Unhandled promise rejection
  When I run "UnhandledJsPromiseRejectionScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UnhandledJsPromiseRejectionScenario"

Scenario: Catching an Unhandled Native error
  When I run "UnhandledNativeErrorScenario" and relaunch the app
  And I configure Bugsnag for "UnhandledNativeErrorScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "java.lang.RuntimeException"
  And the exception "message" equals "UnhandledNativeErrorScenario"
