@http_errors
Feature: HTTP Errors

  HTTP errors plugin reports network request failures, including those made using fetch, and xml http requests.

  Scenario: Fetch request
    When I navigate to the test URL "/http_errors?request=fetch"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API

    And I define "expected.context" as "GET <browser.hostname>"
    And I define "expected.exception.message" as "404: <browser.url>/reflect?status=404"
    And I define "expected.request.url" as "<browser.url>/reflect?status=404"

    And the exception "errorClass" equals "HTTPError"
    And the error payload field "events.0.exceptions.0.message" equals the stored value "expected.exception.message"
    And the event "severity" equals "error"
    And the event "unhandled" is true
    And the event "severityReason.type" equals "httpError"
    And the error payload field "events.0.context" equals the stored value "expected.context"

    And the error payload field "events.0.request.url" equals the stored value "expected.request.url"
    And the event "request.httpMethod" equals "GET"
    And the event "request.params.status" equals "404"
    And the event "request.params.token" equals "[REDACTED]"
    And the event "request.body" equals ""
    And the event "request.bodyLength" equals 0

    And the event "response.statusCode" equals 404
    And the event "response.headers.content-length" equals "37"
    
    # Response body is not captured for fetch requests
    And the event "response.body" is null
    And the event "response.bodyLength" is null

  Scenario: XML HTTP Request
    When I navigate to the test URL "/http_errors?request=xhr"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API

    And I define "expected.context" as "GET <browser.hostname>"
    And I define "expected.exception.message" as "404: <browser.url>/reflect?status=404"
    And I define "expected.request.url" as "<browser.url>/reflect?status=404"

    And the exception "errorClass" equals "HTTPError"
    And the error payload field "events.0.exceptions.0.message" equals the stored value "expected.exception.message"
    And the event "severity" equals "error"
    And the event "unhandled" is true
    And the event "severityReason.type" equals "httpError"
    And the error payload field "events.0.context" equals the stored value "expected.context"

    And the error payload field "events.0.request.url" equals the stored value "expected.request.url"
    And the event "request.httpMethod" equals "GET"
    And the event "request.params.status" equals "404"
    And the event "request.params.token" equals "[REDACTED]"
    And the event "request.body" equals ""
    And the event "request.bodyLength" equals 0

    And the event "response.statusCode" equals 404
    And the event "response.headers.content-length" equals "37"
    And the event "response.body" equals "Returned status 404 after waiting  ms"
    And the event "response.bodyLength" equals 37
   