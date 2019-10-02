Feature: Callbacks

Scenario: Callbacks can be added to the client
  When I run "CallbackOnClientScenario"
  Then I wait to receive a request
  And the exception "message" equals "CallbackOnClientError"
  And the event "metaData.extra.reason" equals "CallbackOnClient"

Scenario: Callbacks can be added to a notify
  When I run "CallbackOnNotifyScenario"
  Then I wait to receive a request
  And the exception "message" equals "CallbackOnNotifyError"
  And the event "metaData.extra.reason" equals "CallbackOnNotify"
