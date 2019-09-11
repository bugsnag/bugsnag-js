Feature: Placeholders

Scenario: startScenario defaults
  When I run ""
  Then I wait to receive a request
  And the payload field "type" equals "Start Scenario"
  And the payload field "state.currentScenario" equals ""
  And the payload field "state.scenarioMetaData" equals ""

Scenario: startScenario with scenario
  When I run "scenario with scenario"
  Then I wait to receive a request
  And the payload field "type" equals "Start Scenario"
  And the payload field "state.currentScenario" equals "scenario with scenario"
  And the payload field "state.scenarioMetaData" equals ""

Scenario: startScenario with meta data
  When I configure the app to run in the "scenario with metaData" state
  And I run ""
  Then I wait to receive a request
  And the payload field "type" equals "Start Scenario"
  And the payload field "state.currentScenario" equals ""
  And the payload field "state.scenarioMetaData" equals "scenario with metaData"

Scenario: startBugsnag defaults
  When I configure Bugsnag for ""
  Then I wait to receive a request
  And the payload field "type" equals "Start Bugsnag"
  And the payload field "state.currentScenario" equals ""
  And the payload field "state.scenarioMetaData" equals ""

Scenario: startBugsnag with scenario
  When I configure Bugsnag for "bugsnag with scenario"
  Then I wait to receive a request
  And the payload field "type" equals "Start Bugsnag"
  And the payload field "state.currentScenario" equals "bugsnag with scenario"
  And the payload field "state.scenarioMetaData" equals ""

Scenario: startBugsnag with meta data
  When I configure the app to run in the "bugsnag with metaData" state
  And I configure Bugsnag for ""
  Then I wait to receive a request
  And the payload field "type" equals "Start Bugsnag"
  And the payload field "state.currentScenario" equals ""
  And the payload field "state.scenarioMetaData" equals "bugsnag with metaData"