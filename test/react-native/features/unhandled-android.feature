@android_only
Feature: Reporting unhandled errors

Scenario: Reporting an Unhandled error
  When I run "UnhandledJsErrorScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledJsErrorScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "type" equals "reactnativejs"
  And the event "unhandled" is true
  And the exception "message" equals "UnhandledJsErrorScenario"

Scenario: Reporting an Unhandled promise rejection
  When I run "UnhandledJsPromiseRejectionScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "type" equals "reactnativejs"
  And the event "unhandled" is true
  And the exception "message" equals "UnhandledJsPromiseRejectionScenario"

Scenario: Reporting an Unhandled promise rejection as handled
  When I run "UnhandledJsPromiseRejectionAsHandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "type" equals "reactnativejs"
  And the event "unhandled" is false
  And the exception "message" equals "UnhandledJsPromiseRejectionAsHandledScenario"

Scenario: Reporting an Unhandled Native error
  When I run "UnhandledNativeErrorScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledNativeErrorScenario"
  Then I wait to receive an error
  And the event "unhandled" is true
  And the event "exceptions.0.errorClass" equals the version-dependent string:
  | arch | version | value                      |
  | new  | 0.78    | Error                      |
  | new  | 0.77    | Error                      |
  | new  | 0.76    | Error                      |
  | new  | 0.75    | Error                      |
  | new  | 0.74    | Error                      |
  | new  | default | java.lang.RuntimeException |
  | old  | default | java.lang.RuntimeException |
  And the event "exceptions.0.type" equals the version-dependent string:
  | arch | version | value                      |
  | new  | 0.78    | reactnativejs              |
  | new  | 0.77    | reactnativejs              |
  | new  | 0.76    | reactnativejs              |
  | new  | 0.75    | reactnativejs              |
  | new  | 0.74    | reactnativejs              |
  | new  | default | android                    |
  | old  | default | android                    |
  And the event "exceptions.0.message" equals the version-dependent string:
  | arch | version | value                                                   |
  | new  | 0.78    | Exception in HostFunction: UnhandledNativeErrorScenario |
  | new  | 0.77    | Exception in HostFunction: UnhandledNativeErrorScenario |
  | new  | 0.76    | Exception in HostFunction: UnhandledNativeErrorScenario |
  | new  | 0.75    | Exception in HostFunction: UnhandledNativeErrorScenario |
  | new  | 0.74    | Exception in HostFunction: UnhandledNativeErrorScenario |
  | new  | default | UnhandledNativeErrorScenario                            |
  | old  | default | UnhandledNativeErrorScenario                            |

Scenario: Updating severity on an unhandled JS error
  When I run "UnhandledJsErrorSeverityScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledJsErrorSeverityScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UnhandledJsErrorSeverityScenario"
  And the event "unhandled" is true
  And the event "severity" equals "info"
