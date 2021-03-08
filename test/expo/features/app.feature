Feature: Expo App data

Background:
  Given the element "appFeature" is present
  And I click the element "appFeature"

Scenario: App data is included by default
  Given the element "defaultAppButton" is present
  When I click the element "defaultAppButton"
  Then I wait to receive an error
  And the event "app.releaseStage" equals "production"
  And the event "app.version" equals "2.0.0"
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null
  And the event "app.inForeground" is true
  And the event "app.type" equals the current OS name
  And the error Bugsnag-Integrity header is valid

Scenario: App data can be modified by a callback
  Given the element "enhancedAppButton" is present
  When I click the element "enhancedAppButton"
  Then I wait to receive an error
  And the event "app.releaseStage" equals "enhancedReleaseStage"
  And the event "app.version" equals "5.5.5"
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null
  And the event "app.inForeground" is true
  And the event "app.type" equals "custom app type"
  And the error Bugsnag-Integrity header is valid
