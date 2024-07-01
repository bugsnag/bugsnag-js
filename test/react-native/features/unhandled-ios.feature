@ios_only
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

Scenario: Reporting an Unhandled Native error
  When I run "UnhandledNativeErrorScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledNativeErrorScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals the version-dependent string:
  | arch | version | value                   |
  | new  | 0.74    | N8facebook3jsi7JSErrorE |
  | new  | 0.73    | N8facebook3jsi7JSErrorE |
  | new  | default | NSException             |
  | old  | default | NSException             |

  And the event "exceptions.0.type" equals "cocoa"
  And the event "unhandled" is true
  And the event "exceptions.0.message" equals the version-dependent string:
  | arch | version | value                                                                                                                     |
  | new  | 0.74    | Exception in HostFunction: UnhandledNativeErrorScenario\n\nError: Exception in HostFunction: UnhandledNativeErrorScenario |
  | new  | 0.73    | Exception in HostFunction: UnhandledNativeErrorScenario\n\nError: Exception in HostFunction: UnhandledNativeErrorScenario |
  | new  | default | UnhandledNativeErrorScenario                                                                                              |
  | old  | default | UnhandledNativeErrorScenario                                                                                              |

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
