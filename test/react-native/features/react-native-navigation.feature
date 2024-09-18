@navigation @skip_new_arch
Feature: Navigation plugin features

Scenario: Navigating screens causes breadcrumbs and context to be updated
  When I run "ReactNativeNavigationBreadcrumbsEnabledScenario"
  And I relaunch the app after a crash
  And I configure Bugsnag for "ReactNativeNavigationBreadcrumbsEnabledScenario"
  And I wait to receive 3 errors

  # Handled error on Home screen
  Then the exception "message" equals "HomeNavigationError"
  And the event "context" equals "Home"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeReadyNavigation.json"
  And I discard the oldest error

  # Handled error on Details screen
  Then the exception "message" equals "DetailsNavigationError"
  And the event "context" equals "Details"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeReadyNavigation.json"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeToDetailsNavigation.json"
  And I discard the oldest error

  # Unhandled error on Details screen
  Then the exception "message" equals "DetailsNavigationUnhandledError"
  And the event "unhandled" is true
  And the event "context" equals "Details"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeReadyNavigation.json"
  And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeToDetailsNavigation.json"

Scenario: Navigating when navigation breadcrumbs are disabled only updates context
  When I run "ReactNativeNavigationBreadcrumbsDisabledScenario"
  And I relaunch the app after a crash
  And I configure Bugsnag for "ReactNativeNavigationBreadcrumbsDisabledScenario"
  And I wait to receive 3 errors

  # Handled error on Home screen
  Then the exception "message" equals "HomeNavigationError"
  And the event "context" equals "Home"
  And the event does not have a "navigation" breadcrumb
  And I discard the oldest error

  # Handled error on Details screen
  Then the exception "message" equals "DetailsNavigationError"
  And the event "context" equals "Details"
  And the event does not have a "navigation" breadcrumb
  And I discard the oldest error

  # Unhandled error on Details screen
  Then the exception "message" equals "DetailsNavigationUnhandledError"
  And the event "unhandled" is true
  And the event "context" equals "Details"
  And the event does not have a "navigation" breadcrumb
