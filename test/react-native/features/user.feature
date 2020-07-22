Feature: User

Scenario: Setting user in JS via client
  When I run "UserJsClientScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UserJsClientScenario"
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"

Scenario: Setting user in JS via config
  When I run "UserJsConfigScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UserJsConfigScenario"
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"

Scenario: Setting user in JS via event
  When I run "UserJsEventScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UserJsEventScenario"
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"

Scenario: Setting user in native via client
  When I run "UserNativeClientScenario" and relaunch the app
  And I configure Bugsnag for "UserNativeClientScenario"
  Then I wait to receive a request
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "UserNativeClientScenario"
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"
