@navigation
Feature: Navigation plugin features

Scenario: A navigation breadcrumb is added when changing screen
    When I trigger a handled error
    And I wait to receive a request
    Then the exception "message" equals "HomeNavigationError"
    And the event "context" equals "Home"
    And I discard the oldest request

    When I navigate to a different screen
    And I trigger a handled error
    And I wait to receive a request
    Then the exception "message" equals "DetailsNavigationError"
    And the event "context" equals "Details"
    And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/expected_breadcrumbs/HomeToDetailsNavigation.json"