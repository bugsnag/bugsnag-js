Feature: Breadcrumbs

Scenario: Automatic "Bugsnag loaded" breadcrumb
  When I run "BreadcrumbsAutomaticLoadedScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "BreadcrumbsAutomaticLoadedScenario"
  And the event has a "state" breadcrumb named "Bugsnag loaded"
  And the event does not have a "error" breadcrumb

Scenario: Automatic breadcrumb for errors
  When I run "BreadcrumbsAutomaticErrorScenario"
  Then I wait to receive 2 errors
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "BreadcrumbsAutomaticErrorScenarioA"
  And the event does not have a "error" breadcrumb
  And I discard the oldest error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "BreadcrumbsAutomaticErrorScenarioB"
  And the event has a "error" breadcrumb named "Error"

Scenario: Automatic breadcrumbs when enabledBreadcrumbTypes is null
  When I run "BreadcrumbsNullEnabledBreadcrumbTypesScenario"
  Then I wait to receive 2 errors
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "BreadcrumbsNullEnabledBreadcrumbTypesScenarioA"
  And the event has a "state" breadcrumb named "Bugsnag loaded"
  And the event does not have a "error" breadcrumb
  And I discard the oldest error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "BreadcrumbsNullEnabledBreadcrumbTypesScenarioB"
  And the event has a "state" breadcrumb named "Bugsnag loaded"
  And the event has a "error" breadcrumb named "Error"

Scenario: Manual breadcrumbs (JS)
  When I run "BreadcrumbsJsManualScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "BreadcrumbsJsManualScenario"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/JsManualScenario.json"

Scenario: Manual breadcrumbs (Native)
  When I run "BreadcrumbsNativeManualScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "BreadcrumbsNativeManualScenario"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/NativeManualScenario.json"
