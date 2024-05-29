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

# Skipped on iOS New Arch pending PLAT-12184
@skip_ios_new_arch
Scenario: Reporting an Unhandled Native error
  When I run "UnhandledNativeErrorScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledNativeErrorScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the event "exceptions.0.type" equals the platform-dependent string:
  | android | android |
  | ios     | cocoa   |
  And the event "unhandled" is true
  And the exception "message" equals "UnhandledNativeErrorScenario"

# TODO: remove this scenario when PLAT-12184 is resolved
@ios_only @skip_old_arch
Scenario: Reporting an Unhandled Native error
  When I run "UnhandledNativeErrorScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledNativeErrorScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals "N8facebook3jsi7JSErrorE"
  And the event "exceptions.0.type" equals "cocoa"
  And the event "unhandled" is true
  And the exception "message" starts with "Exception in HostFunction: UnhandledNativeErrorScenario"

Scenario: Updating severity on an unhandled JS error
  When I run "UnhandledJsErrorSeverityScenario" and relaunch the crashed app
  And I configure Bugsnag for "UnhandledJsErrorSeverityScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UnhandledJsErrorSeverityScenario"
  And the event "unhandled" is true
  And the event "severity" equals "info"

@ios_only @skip_new_arch
Scenario: Reporting an unhandled Objective-C exception raise by RCTFatal
  When I run "RCTFatalScenario" and relaunch the crashed app
  And I configure Bugsnag for "RCTFatalScenario"
  Then I wait to receive an error
  And the exception "errorClass" matches "RCTFatalException: .*"
  And the event "unhandled" is true
  And the event "severity" equals "error"
