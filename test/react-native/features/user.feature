Feature: User

Scenario: Setting user in JS via client
  When I run "UserJsClientScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UserJsClientScenario"
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"

Scenario: Setting user in JS via config
  When I run "UserJsConfigScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UserJsConfigScenario"
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"

Scenario: Setting user in JS via event
  When I run "UserJsEventScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UserJsEventScenario"
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"

# Skipped on iOS New Arch pending PLAT-12184
@skip_ios_new_arch
Scenario: Setting user in native via client
  When I run "UserNativeClientScenario" and relaunch the crashed app
  And I configure Bugsnag for "UserNativeClientScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "UserNativeClientScenario"
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"

# TODO: remove this scenario when PLAT-12184 is resolved
@ios_only @skip_old_arch
Scenario: Setting user in native via client
  When I run "UserNativeClientScenario" and relaunch the crashed app
  And I configure Bugsnag for "UserNativeClientScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals "N8facebook3jsi7JSErrorE"
  And the exception "message" starts with "Exception in HostFunction: UserNativeClientScenario"
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"

# Skipped on iOS New Arch pending PLAT-12184
@skip_ios_new_arch
Scenario: Setting user in JS via client and sending Native error
  When I run "UserJsNativeScenario" and relaunch the crashed app
  And I configure Bugsnag for "UserJsNativeScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the event "exceptions.0.type" equals the platform-dependent string:
  | android | android |
  | ios     | cocoa   |
  And the event "unhandled" is true
  And the exception "message" equals "UnhandledNativeErrorScenario"
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"

# TODO: remove this scenario when PLAT-12184 is resolved
@ios_only @skip_old_arch
Scenario: Setting user in JS via client and sending Native error
  When I run "UserJsNativeScenario" and relaunch the crashed app
  And I configure Bugsnag for "UserJsNativeScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals "N8facebook3jsi7JSErrorE"
  And the event "exceptions.0.type" equals "cocoa"
  And the event "unhandled" is true
  And the exception "message" starts with "Exception in HostFunction: UnhandledNativeErrorScenario"
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"
