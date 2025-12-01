@http_errors
Feature: HTTP Errors

  HTTP errors plugin reports network request failures, including those made using fetch, and xml http requests.

  Scenario: Fetch request
    When I navigate to the test URL "/http_errors/fetch/index.html"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API

    And the exception "errorClass" equals "HTTPError"
    And the exception "message" equals "404: /reflect?status=404"
    And the event "severityReason.type" equals "httpError"
    # And the event "context" equals "GET localhost"

    # And the event "request.url" equals "http://localhost:8000/reflect?status=404"
    And the event "request.httpMethod" equals "GET"
    # And the event "request.httpVersion" equals "HTTP/1.1"
    # And the request "headers" contains "Host" equals "localhost:8000"
    # And the event "request.params" is an empty map # status=404
    # And the request "body" equals ""
    # And the request "bodyLength" equals 0

    And the event "response.statusCode" equals 404
    # And the response "headers" contains "Content-Type" equals "application/json; charset=utf-8"
    # And the response "body" contains "{'status':404}"
    # And the response "bodyLength" equals 15
