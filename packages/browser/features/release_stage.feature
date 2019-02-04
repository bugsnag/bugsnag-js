@release_stage
Feature: Configuring releaseStage and notifyReleaseStages

Scenario: setting releaseStage=production
  When I navigate to the URL "/release_stage/script/a.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "production"

Scenario: setting releaseStage=development
  When I navigate to the URL "/release_stage/script/b.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "development"

Scenario: setting releaseStage=qa notifyReleaseStages=[production,staging]
  When I navigate to the URL "/release_stage/script/c.html"
  And I wait for 2 seconds
  Then I should receive no requests

Scenario: setting releaseStage=staging notifyReleaseStages=[production,staging]
  When I navigate to the URL "/release_stage/script/d.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "staging"
