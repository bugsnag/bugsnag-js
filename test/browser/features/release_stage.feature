@release_stage
Feature: Configuring releaseStage and enabledReleaseStages

Scenario: setting releaseStage=production
  When I navigate to the test URL "/release_stage/script/a.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "production"

Scenario: setting releaseStage=development
  When I navigate to the test URL "/release_stage/script/b.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "development"

Scenario: setting releaseStage=qa enabledReleaseStages=[production,staging]
  When I navigate to the test URL "/release_stage/script/c.html"
  And I wait for 2 seconds
  Then I should receive no requests

Scenario: setting releaseStage=staging enabledReleaseStages=[production,staging]
  When I navigate to the test URL "/release_stage/script/d.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "staging"

Scenario: setting releaseStage=development enabledReleaseStages=null
  When I navigate to the test URL "/release_stage/script/e.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "development"

Scenario: setting enabledReleaseStages=[]
  When I navigate to the test URL "/release_stage/script/f.html"
  And I wait for 2 seconds
  Then I should receive no requests
