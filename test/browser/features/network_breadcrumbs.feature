@network_breadcrumbs
Feature: Network breadcrumbs

  Bugsnag error reports should include breadcrumbs for network requests, including those made using fetch, and xml http requests.

  @requires_fetch
  Scenario: A fetch request succeeds
    When I navigate to the test URL "/network_breadcrumbs/script/fetch_success.html"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/network_breadcrumbs/json/fetch_success.json"

  @requires_fetch
  Scenario: A fetch request fails
    When I navigate to the test URL "/network_breadcrumbs/script/fetch_failure.html"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/network_breadcrumbs/json/fetch_failure.json"

  @requires_weak_map
  @requires_xml_http_request
  Scenario: An xmlHttpRequest succeeds
    When I navigate to the test URL "/network_breadcrumbs/script/xhr_success.html"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/network_breadcrumbs/json/xhr_success.json"

  @requires_weak_map
  @requires_xml_http_request
  Scenario: An xmlHttpRequest fails
    When I navigate to the test URL "/network_breadcrumbs/script/xhr_failure.html"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/network_breadcrumbs/json/xhr_failure.json"
