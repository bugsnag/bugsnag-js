@network_breadcrumbs
Feature: Network breadcrumbs

  Scenario: Valid network breadcrumbs when using fetch()
    When I navigate to the test URL "/network_breadcrumbs/script/fetch.html"
    And the test should run in this browser
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    # Successful request
    And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/network_breadcrumbs/json/fetch_succeeded.json"
    # Unsuccessful request
    And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/network_breadcrumbs/json/fetch_failed.json"

  Scenario: Valid network breadcrumbs when using xmlHttpRequest
    When I navigate to the test URL "/network_breadcrumbs/script/xml_http_request.html"
    And the test should run in this browser
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    # Successful request
    And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/network_breadcrumbs/json/xhr_succeeded.json"
    # Unsuccessful request
    And the event contains a breadcrumb matching the JSON fixture in "features/fixtures/network_breadcrumbs/json/xhr_failed.json"
