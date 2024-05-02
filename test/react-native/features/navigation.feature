@navigation
Feature: Navigation plugin features

Scenario: Navigating screens causes breadcrumbs and context to be updated
  When I run the navigation scenario "ReactNavigationBreadcrumbsEnabledScenario"
  And I trigger a handled error
  And I wait to receive an error
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
  And I relaunch the app after a crash
  And I configure Bugsnag for the navigation scenario "ReactNavigationBreadcrumbsEnabledScenario"
  And I wait to receive an error
  Then the exception "message" equals "DetailsNavigationUnhandledError"
  And the event "unhandled" is true
  And the event "context" equals "Details"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeReadyNavigation.json"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeToDetailsNavigation.json"

Scenario: Navigating when navigation breadcrumbs are disabled only updates context
  When I run the navigation scenario "ReactNavigationBreadcrumbsDisabledScenario"
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
  And I relaunch the app after a crash
  And I configure Bugsnag for the navigation scenario "ReactNavigationBreadcrumbsDisabledScenario"
  And I wait to receive an error
  Then the exception "message" equals "DetailsNavigationUnhandledError"
  And the event "unhandled" is true
  And the event "context" equals "Details"
  And the event does not have a "navigation" breadcrumb
