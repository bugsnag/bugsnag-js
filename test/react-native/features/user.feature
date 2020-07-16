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

# disabled until android bug is fixed
# Scenario: Setting user in JS via event
#   When I run "UserJsConfigScenario"
#   Then I wait to receive a request
#   And the exception "errorClass" equals "Error"
#   And the exception "message" equals "UserJsConfigScenario"
#   And the event "user.email" equals "bug@sn.ag"
#   And the event "user.name" equals "Bug Snag"
#   And the event "user.id" equals "123"
