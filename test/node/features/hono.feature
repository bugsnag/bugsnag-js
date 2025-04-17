@skip_before_node_18
Feature: @bugsnag/plugin-hono

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "hono"
  And I wait for the host "hono" to open port "80"

Scenario: A handled error
  Then I open the URL "http://hono/handled" tolerating any error
  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://hono/handled"
  And the event "request.httpMethod" equals "GET"

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://hono/sync?a=1&b=2c" tolerating any error
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the event "severityReason.attributes.framework" equals "Hono"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "sync"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://hono/sync?a=1&b=2c"
  And the event "request.httpMethod" equals "GET"
  And the event "metaData.error_handler.after" is null
  And the event "metaData.request.path" equals "/sync"
  And the event "metaData.request.query.a" equals "1"
  And the event "metaData.request.query.b" equals "2c"

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://hono/async" tolerating any error
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the event "severityReason.attributes.framework" equals "Hono"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "async"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://hono/async"
  And the event "request.httpMethod" equals "GET"
  And the event "severityReason.attributes.framework" equals "Hono"

Scenario: a synchronous promise rejection in a route
  Then I open the URL "http://hono/rejection-sync"
  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "reject sync"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://hono/rejection-sync"
  And the event "request.httpMethod" equals "GET"

Scenario: an asynchronous promise rejection in a route
  Then I open the URL "http://hono/rejection-async"
  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "reject async"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://hono/rejection-async"
  And the event "request.httpMethod" equals "GET"

Scenario: throwing non-Error error
  Then I open the URL "http://hono/throw-non-error"
  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the exception "errorClass" equals "InvalidError"
  And the exception "message" matches "unhandledRejection handler received a non-error\."
  And the exception "type" equals "nodejs"
  And the event "request.url" equals "http://hono/throw-non-error"
  And the event "request.httpMethod" equals "GET"