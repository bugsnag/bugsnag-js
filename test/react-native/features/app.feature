Feature: App data

Scenario: App data is included by default
  When I run "AppDefaultScenario"
  Then I wait to receive a request
  And the exception "message" equals "AppDefaultError"
  And the event "app.releaseStage" equals "production"
  And the event "app.version" equals "1.0"
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null
  And the event "app.inForeground" is true
