@http_errors
Feature: HTTP Errors

  HTTP errors plugin reports network request failures, including those made using fetch, and xml http requests.

  Scenario: Fetch request
    When I navigate to the test URL "/http_errors/fetch/index.html"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API

    And the exception "errorClass" equals "HTTPError"
    And the exception "message" equals "404: http://localhost:9339/reflect?status=404"
    And the event "severity" equals "error"
    And the event "unhandled" is true
    And the event "severityReason.type" equals "httpError"
    And the event "context" equals "GET localhost"

    And the event "request.url" equals "http://localhost:9339/reflect?status=404"
    And the event "request.httpMethod" equals "GET"
    # And the event "request.httpVersion" equals "HTTP/1.1"
    # And the event "request.params" contains "status" equals "404"
    And the event "request.body" equals ""
    And the event "request.bodyLength" equals 0

    And the event "response.statusCode" equals 404
    # And the event "response.headers" contains "content-length" equals "37"
    And the event "response.body" equals "Returned status 404 after waiting  ms"
    And the event "response.bodyLength" equals 37
