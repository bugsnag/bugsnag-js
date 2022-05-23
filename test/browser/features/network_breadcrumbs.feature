@network_breadcrumbs
Feature: Network breadcrumbs

Scenario: fetch
  When I navigate to the test URL "/network_breadcrumbs/script/fetch.html"
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API

Scenario: xml http request
  When I navigate to the test URL "/network_breadcrumbs/script/xml_http_request.html"
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API
