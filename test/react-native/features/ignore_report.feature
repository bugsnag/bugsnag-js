Feature: Ignoring a report

Scenario: A report can be ignored by returning false
  When I run "IgnoredReportScenario"
  And I wait for 5 seconds
  Then I should receive no requests
