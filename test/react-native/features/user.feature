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

Scenario: Setting user in native via client
  When I run "UserNativeClientScenario" and relaunch the crashed app
  And I configure Bugsnag for "UserNativeClientScenario"
  Then I wait to receive an error
  And the exception "message" matches "UserNativeClientScenario"
  And the event "unhandled" is true
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"

Scenario: Setting user in JS via client and sending Native error
  When I run "UserJsNativeScenario" and relaunch the crashed app
  And I configure Bugsnag for "UserJsNativeScenario"
  Then I wait to receive an error
  And the exception "message" matches "UnhandledNativeErrorScenario"
  And the event "unhandled" is true
  And the event "user.email" equals "bug@sn.ag"
  And the event "user.name" equals "Bug Snag"
  And the event "user.id" equals "123"

