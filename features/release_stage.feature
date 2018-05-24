@release_stage
Feature: Configuring releaseStage and notifyReleaseStages

Scenario Outline: setting releaseStage=production
  When I navigate to the URL "/release_stage/<type>/a.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "production"
    Examples:
      | type       |
      | script     |

Scenario Outline: setting releaseStage=development
  When I navigate to the URL "/release_stage/<type>/b.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "development"
    Examples:
      | type       |
      | script     |

Scenario Outline: setting releaseStage=qa notifyReleaseStages=[production,staging]
  When I navigate to the URL "/release_stage/<type>/c.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive no requests
    Examples:
      | type       |
      | script     |

Scenario Outline: setting releaseStage=staging notifyReleaseStages=[production,staging]
  When I navigate to the URL "/release_stage/<type>/d.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "app.releaseStage" equals "staging"
    Examples:
      | type       |
      | script     |
