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

Scenario: Reporting an Unhandled Native error (async method)
  When I run "UnhandledNativeErrorScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledNativeErrorScenario"
  Then I wait to receive an error
  And the event "unhandled" is true
  And the event "exceptions.0.errorClass" equals the version-dependent string:
  | arch | version | value                      |
  | new  | 0.72    | java.lang.RuntimeException |
  | new  | default | Error                      |
  | old  | default | java.lang.RuntimeException |
  And the event "exceptions.0.type" equals the version-dependent string:
  | arch | version | value                      |
  | new  | 0.72    | android                    |
  | new  | default | reactnativejs              |
  | old  | default | android                    |
  And the event "exceptions.0.message" equals the version-dependent string:
  | arch | version | value                                                   |
  | new  | 0.72    | UnhandledNativeErrorScenario                            |
  | new  | default | Exception in HostFunction: UnhandledNativeErrorScenario |
  | old  | default | UnhandledNativeErrorScenario                            |

Scenario: Reporting an Unhandled Native error (synchronous method)
  When I run "UnhandledNativeErrorSyncScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledNativeErrorSyncScenario"
  Then I wait to receive an error
  And the event "unhandled" is true
  And the event "exceptions.0.errorClass" equals the version-dependent string:
  | arch | version | value                      |
  | new  | 0.72    | java.lang.RuntimeException |
  | new  | default | Error                      |
  | old  | default | java.lang.RuntimeException |
  And the event "exceptions.0.type" equals the version-dependent string:
  | arch | version | value                      |
  | new  | 0.72    | android                    |
  | new  | default | reactnativejs              |
  | old  | default | android                    |
  And the event "exceptions.0.message" equals the version-dependent string:
  | arch | version | value                                                   |
  | new  | 0.72    | UnhandledNativeErrorScenario                            |
  | new  | default | Exception in HostFunction: UnhandledNativeErrorScenario |
  | old  | default | UnhandledNativeErrorScenario                            |

Scenario: Updating severity on an unhandled JS error
  When I run "UnhandledJsErrorSeverityScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledJsErrorSeverityScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UnhandledJsErrorSeverityScenario"
  And the event "unhandled" is true
  And the event "severity" equals "info"
