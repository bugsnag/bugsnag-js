@ios_only
Feature: Reporting unhandled errors

Scenario: Reporting an Unhandled JS error
  When I run "UnhandledJsErrorScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledJsErrorScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "type" equals "reactnativejs"
  And the event "unhandled" is true
  And the exception "message" equals "UnhandledJsErrorScenario"

Scenario: Reporting an Unhandled JS promise rejection
  When I run "UnhandledJsPromiseRejectionScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "type" equals "reactnativejs"
  And the event "unhandled" is true
  And the exception "message" equals "UnhandledJsPromiseRejectionScenario"

Scenario: Reporting an Unhandled JS promise rejection as handled
  When I run "UnhandledJsPromiseRejectionAsHandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "type" equals "reactnativejs"
  And the event "unhandled" is false
  And the exception "message" equals "UnhandledJsPromiseRejectionAsHandledScenario"

Scenario: Reporting an Unhandled error in an asynchronous native method
  When I run "UnhandledNativeErrorScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledNativeErrorScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals the version-dependent string:
  | arch | version | value                   |
  | new  | 0.79    | NSException             |
  | new  | 0.78    | NSException             |
  | new  | 0.77    | NSException             |
  | new  | 0.76    | NSException             |
  | new  | 0.75    | N8facebook3jsi7JSErrorE |
  | new  | 0.74    | N8facebook3jsi7JSErrorE |
  | new  | 0.73    | N8facebook3jsi7JSErrorE |
  | new  | default | NSException             |
  | old  | default | NSException             |

  And the event "exceptions.0.type" equals "cocoa"
  And the event "unhandled" is true
  And the event "exceptions.0.message" equals the version-dependent string:
  | arch | version | value                                                                                                                     |
  | new  | 0.79    | UnhandledNativeErrorScenario                                                                                              |
  | new  | 0.78    | UnhandledNativeErrorScenario                                                                                              |
  | new  | 0.77    | UnhandledNativeErrorScenario                                                                                              |
  | new  | 0.76    | UnhandledNativeErrorScenario                                                                                              |
  | new  | 0.75    | Exception in HostFunction: UnhandledNativeErrorScenario\n\nError: Exception in HostFunction: UnhandledNativeErrorScenario |
  | new  | 0.74    | Exception in HostFunction: UnhandledNativeErrorScenario\n\nError: Exception in HostFunction: UnhandledNativeErrorScenario |
  | new  | 0.73    | Exception in HostFunction: UnhandledNativeErrorScenario\n\nError: Exception in HostFunction: UnhandledNativeErrorScenario |
  | new  | default | UnhandledNativeErrorScenario                                                                                              |
  | old  | default | UnhandledNativeErrorScenario                                                                                              |

Scenario: Reporting an Unhandled error in a synchronous native method
  When I run "UnhandledNativeErrorSyncScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledNativeErrorSyncScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals "Error"

  And the event "exceptions.0.type" equals "reactnativejs"
  And the event "unhandled" is true
  And the event "exceptions.0.message" equals the version-dependent string:
  | arch | version | value                                                                                  |
  | new  | default | BugsnagTestInterface.runScenarioSync raised an exception: UnhandledNativeErrorScenario |
  | new  | 0.74    | Exception in HostFunction: UnhandledNativeErrorScenario                                |
  | new  | 0.72    | Exception in HostFunction: <unknown>                                                   |
  | old  | default | Exception in HostFunction: <unknown>                                                   |

Scenario: Updating severity on an unhandled JS error
  When I run "UnhandledJsErrorSeverityScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledJsErrorSeverityScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UnhandledJsErrorSeverityScenario"
  And the event "unhandled" is true
  And the event "severity" equals "info"

@skip_new_arch
Scenario: Reporting an unhandled Objective-C exception raise by RCTFatal
  When I run "RCTFatalScenario" and relaunch the crashed app
  And I configure Bugsnag for "RCTFatalScenario"
  Then I wait to receive an error
  And the exception "errorClass" matches "RCTFatalException: .*"
  And the event "unhandled" is true
  And the event "severity" equals "error"
