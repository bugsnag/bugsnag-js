@skip_node_18
Feature: @bugsnag/plugin-restify

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "restify"
  And I wait for the host "restify" to open port "80"

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://restify/sync/hello?a=1&b=2&c=3" tolerating any error
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the event "severityReason.attributes.framework" equals "Restify"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "hello"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://restify/sync/hello"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
  And the event "metaData.request.path" equals "/sync/hello"
  And the event "metaData.request.query.a" equals "1"
  And the event "metaData.request.query.b" equals "2"
  And the event "metaData.request.query.c" equals "3"
  And the event "metaData.request.connection" is not null
  And the event "metaData.request.params.message" equals "hello"

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://restify/async" tolerating any error
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the event "severityReason.attributes.framework" equals "Restify"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "async"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "metaData.request.query" is null
  And the event "request.url" equals "http://restify/async"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null

Scenario: an error passed to next(err)
  Then I open the URL "http://restify/next"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the event "severityReason.attributes.framework" equals "Restify"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "next"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://restify/next"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null

Scenario: a handled error passed to req.bugsnag.notify()
  Then I open the URL "http://restify/handled"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://restify/handled"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null

Scenario: a synchronous promise rejection in a route
  Then I open the URL "http://restify/rejection-sync"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the event "severityReason.attributes.framework" equals "Restify"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "reject sync"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://restify/rejection-sync"
  And the event "request.httpMethod" equals "GET"

Scenario: an asynchronous promise rejection in a route
  Then I open the URL "http://restify/rejection-async"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the event "severityReason.attributes.framework" equals "Restify"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "reject async"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://restify/rejection-async"
  And the event "request.httpMethod" equals "GET"

@skip_before_node_16
Scenario: an unhandled promise rejection in an async callback (with request context)
  Then I open the URL "http://restify/unhandled-rejection-async-callback" and get a 200 response
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the event "severityReason.attributes" is null
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "unhandled rejection in async callback"
  And the event "request.url" equals "http://restify/unhandled-rejection-async-callback"
  And the event "request.httpMethod" equals "GET"

Scenario: an unhandled promise rejection in an async callback (without request context)
  Then I open the URL "http://restify/unhandled-rejection-async-callback" and get a 200 response
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the event "severityReason.attributes" is null
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "unhandled rejection in async callback"