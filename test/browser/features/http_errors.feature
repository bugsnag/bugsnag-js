@http_errors
Feature: HTTP Errors

  HTTP errors plugin reports network request failures, including those made using fetch, and xml http requests.

  Scenario: Fetch request
    When I navigate to the test URL "/http_errors/fetch/index.html"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
