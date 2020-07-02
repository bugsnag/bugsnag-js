Feature: Breadcrumbs

Scenario: Automatic "Bugsnag loaded" breadcrumb
  When I run "BreadcrumbsAutomaticLoadedScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "BreadcrumbsAutomaticLoadedScenario"
  And the event has a "state" breadcrumb named "Bugsnag loaded"
  And the event does not have a "error" breadcrumb

Scenario: Automatic breadcrumb for errors
  When I run "BreadcrumbsAutomaticErrorScenario"
  Then I wait to receive 2 requests
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "BreadcrumbsAutomaticErrorScenarioA"
  And the event does not have a "error" breadcrumb
  And I discard the oldest request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "BreadcrumbsAutomaticErrorScenarioB"
  And the event has a "error" breadcrumb named "Error"
