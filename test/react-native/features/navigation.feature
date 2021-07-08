@navigation
Feature: Navigation plugin features

Scenario: Navigating screens causes breadcrumbs and context to be updated
  When I run "ReactNavigationBreadcrumbsEnabledScenario"
  And I trigger a handled error
  And I wait to receive 3 errors
  Then the exception "message" equals "HomeNavigationError"
  And the event "context" equals "Home"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeReadyNavigation.json"
  And I discard the oldest error

  When I navigate to a different screen
  And I trigger a handled error
  And I wait to receive an error
  Then the exception "message" equals "DetailsNavigationError"
  And the event "context" equals "Details"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeReadyNavigation.json"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeToDetailsNavigation.json"
  And I discard the oldest error

  When I trigger an unhandled error
  And I wait for 5 seconds
  And I relaunch the app
  And I configure Bugsnag for "ReactNavigationBreadcrumbsEnabledScenario"
  And I wait to receive an error
  Then the exception "message" equals "DetailsNavigationUnhandledError"
  And the event "unhandled" is true
  And the event "context" equals "Details"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeReadyNavigation.json"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeToDetailsNavigation.json"

Scenario: Navigating when navigation breadcrumbs are disabled only updates context
  When I run "ReactNavigationBreadcrumbsDisabledScenario"
  And I trigger a handled error
  And I wait to receive an error
  Then the exception "message" equals "HomeNavigationError"
  And the event "context" equals "Home"
  And the event does not have a "navigation" breadcrumb
  And I discard the oldest error

  When I navigate to a different screen
  And I trigger a handled error
  And I wait to receive an error
  Then the exception "message" equals "DetailsNavigationError"
  And the event "context" equals "Details"
  And the event does not have a "navigation" breadcrumb
  And I discard the oldest error

  When I trigger an unhandled error
  And I relaunch the app
  And I configure Bugsnag for "ReactNavigationBreadcrumbsDisabledScenario"
  And I wait to receive an error
  Then the exception "message" equals "DetailsNavigationUnhandledError"
  And the event "unhandled" is true
  And the event "context" equals "Details"
  And the event does not have a "navigation" breadcrumb
