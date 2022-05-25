@network_breadcrumbs
Feature: Network breadcrumbs

  Scenario: fetch
    When I navigate to the test URL "/network_breadcrumbs/script/fetch.html"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    # Successful request
    And the event "breadcrumbs.4.type" equals "request"
    And the event "breadcrumbs.4.name" equals "fetch() succeeded"
    And the event "breadcrumbs.4.timestamp" is a timestamp
    And the event "breadcrumbs.4.metaData.status" equals 200
    # Unsuccessful request
    And the event "breadcrumbs.5.type" equals "request"
    And the event "breadcrumbs.5.name" equals "fetch() failed"
    And the event "breadcrumbs.5.timestamp" is a timestamp
    And the event "breadcrumbs.5.metaData.status" equals 404

  Scenario: xml http request
    When I navigate to the test URL "/network_breadcrumbs/script/xml_http_request.html"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    # Successful request
    And the event "breadcrumbs.4.type" equals "request"
    And the event "breadcrumbs.4.name" equals "XMLHttpRequest succeeded"
    And the event "breadcrumbs.4.timestamp" is a timestamp
    And the event "breadcrumbs.4.metaData.status" equals 200
    # Unsuccessful request
    And the event "breadcrumbs.5.type" equals "request"
    And the event "breadcrumbs.5.name" equals "XMLHttpRequest failed"
    And the event "breadcrumbs.5.timestamp" is a timestamp
    And the event "breadcrumbs.5.metaData.status" equals 404
