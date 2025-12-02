@release_stage
Feature: Configuring releaseStage and enabledReleaseStages

Scenario: setting releaseStage=production
  When I navigate to the test URL "/release_stage/script/release_stage_production.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "production"

Scenario: setting releaseStage=development
  When I navigate to the test URL "/release_stage/script/release_stage_development.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "development"

Scenario: setting releaseStage=qa enabledReleaseStages=[production,staging]
  When I navigate to the test URL "/release_stage/script/release_stage_not_enabled.html"
  Then I should receive no errors

Scenario: setting releaseStage=staging enabledReleaseStages=[production,staging]
  When I navigate to the test URL "/release_stage/script/release_stage_enabled.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "staging"

Scenario: setting releaseStage=development enabledReleaseStages=null
  When I navigate to the test URL "/release_stage/script/null_enabled_stages.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "development"

Scenario: setting enabledReleaseStages=[]
  When I navigate to the test URL "/release_stage/script/empty_enabled_stages.html"
  Then I should receive no errors
