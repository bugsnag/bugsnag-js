@http_errors @requires_set @skip_safari_10 @skip_chrome_43 @skip_ie_11
Feature: HTTP Errors

  HTTP errors plugin reports network request failures, including those made using fetch, and xml http requests.

  @requires_fetch
  Scenario: Fetch Request - GET
    When I navigate to the test URL "/http_errors?request=fetch"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API

    And I define "expected.context" as "GET <browser.hostname>"
    And I define "expected.exception.message" as "401: <browser.url>/reflect?status=401&userId=[REDACTED]"
    And I define "expected.request.url" as "<browser.url>/reflect?status=401&userId=[REDACTED]"

    And the exception "errorClass" equals "HTTPError"
    And the error payload field "events.0.exceptions.0.message" equals the stored value "expected.exception.message"
    And the event "severity" equals "error"
    And the event "unhandled" is true
    And the event "severityReason.type" equals "httpError"
    And the error payload field "events.0.context" equals the stored value "expected.context"

    And the error payload field "events.0.request.url" equals the stored value "expected.request.url"
    And the event "request.httpMethod" equals "GET"
    And the event "request.params.status" equals "401"
    And the event "request.params.userId" equals "[REDACTED]"
    And the event "request.headers.x-token" equals "[REDACTED]"
    And the event "request.body" is null
    And the event "request.bodyLength" is null

    And the event "response.statusCode" equals 401
    And the event "response.headers.content-length" equals "37"
    
    # Response body is not captured for fetch requests
    And the event "response.body" is null
    And the event "response.bodyLength" is null

  Scenario: Fetch Request - POST
    When I navigate to the test URL "/http_errors?request=fetch-post"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API

    And I define "expected.context" as "POST <browser.hostname>"
    And I define "expected.exception.message" as "408: <browser.url>/reflect?status=408&userId=[REDACTED]"
    And I define "expected.request.url" as "<browser.url>/reflect?status=408&userId=[REDACTED]"

    And the exception "errorClass" equals "HTTPError"
    And the error payload field "events.0.exceptions.0.message" equals the stored value "expected.exception.message"
    And the event "severity" equals "error"
    And the event "unhandled" is true
    And the event "severityReason.type" equals "httpError"
    And the error payload field "events.0.context" equals the stored value "expected.context"

    And the error payload field "events.0.request.url" equals the stored value "expected.request.url"
    And the event "request.httpMethod" equals "POST"
    And the event "request.params.status" equals "408"
    And the event "request.params.userId" equals "[REDACTED]"
    And the event "request.headers.x-token" equals "[REDACTED]"
    And the event "request.body" equals "this is the request body"
    And the event "request.bodyLength" equals 24

    And the event "response.statusCode" equals 408
    And the event "response.headers.content-length" equals "37"

    # Response body is not captured for fetch requests
    And the event "response.body" is null
    And the event "response.bodyLength" is null

  @requires_xml_http_request
  Scenario: XHR - GET
    When I navigate to the test URL "/http_errors?request=xhr"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API

    And I define "expected.context" as "GET <browser.hostname>"
    And I define "expected.exception.message" as "404: <browser.url>/reflect?status=404&userId=[REDACTED]"
    And I define "expected.request.url" as "<browser.url>/reflect?status=404&userId=[REDACTED]"

    And the exception "errorClass" equals "HTTPError"
    And the error payload field "events.0.exceptions.0.message" equals the stored value "expected.exception.message"
    And the event "severity" equals "error"
    And the event "unhandled" is true
    And the event "severityReason.type" equals "httpError"
    And the error payload field "events.0.context" equals the stored value "expected.context"

    And the error payload field "events.0.request.url" equals the stored value "expected.request.url"
    And the event "request.httpMethod" equals "GET"
    And the event "request.headers.X-Token" equals "[REDACTED]"
    And the event "request.params.status" equals "404"
    And the event "request.params.userId" equals "[REDACTED]"
    And the event "request.body" is null
    And the event "request.bodyLength" is null

    And the event "response.statusCode" equals 404
    And the event "response.headers.content-length" equals "37"
    And the event "response.body" equals "Returned status 404 after waiting  ms"
    And the event "response.bodyLength" equals 37

  @requires_xml_http_request
  Scenario: XHR - POST
    When I navigate to the test URL "/http_errors?request=xhr-post"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API

    And I define "expected.context" as "POST <browser.hostname>"
    And I define "expected.exception.message" as "403: <browser.url>/reflect?status=403&userId=[REDACTED]"
    And I define "expected.request.url" as "<browser.url>/reflect?status=403&userId=[REDACTED]"

    And the exception "errorClass" equals "HTTPError"
    And the error payload field "events.0.exceptions.0.message" equals the stored value "expected.exception.message"
    And the event "severity" equals "error"
    And the event "unhandled" is true
    And the event "severityReason.type" equals "httpError"
    And the error payload field "events.0.context" equals the stored value "expected.context"

    And the error payload field "events.0.request.url" equals the stored value "expected.request.url"
    And the event "request.httpMethod" equals "POST"
    And the event "request.headers.X-Token" equals "[REDACTED]"
    And the event "request.params.status" equals "403"
    And the event "request.params.userId" equals "[REDACTED]"
    And the event "request.body" equals "this is the request body"
    And the event "request.bodyLength" equals 24

    And the event "response.statusCode" equals 403
    And the event "response.headers.content-length" equals "37"
    And the event "response.body" equals "Returned status 403 after waiting  ms"
    And the event "response.bodyLength" equals 37
