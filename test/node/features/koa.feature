@skip_before_node_8
Feature: @bugsnag/plugin-koa

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "koa"
  And I wait for the host "koa" to open port "80"

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://koa/err" and get a 500 response
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "noooop"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://koa/err"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
  And the event "metaData.error_handler.before" is true
  And the event "metaData.error_handler.after" is null

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://koa/async-err" and get a 500 response
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "async noooop"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "metaData.error_handler.before" is true
  And the event "metaData.error_handler.after" is null

Scenario: An error created with with ctx.throw()
  Then I open the URL "http://koa/ctx-throw" and get a 500 response
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "InternalServerError"
  And the exception "message" equals "thrown"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "node_modules/koa/lib/context.js"
  And the "file" of stack frame 1 equals "scenarios/app.js"
  And the event "metaData.error_handler.before" is true
  And the event "metaData.error_handler.after" is null

Scenario: an error thrown before the requestHandler middleware
  Then I open the URL "http://koa/error-before-handler" and get a 500 response
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "nope"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "metaData.error_handler.before" is true
  And the event "metaData.error_handler.after" is null

Scenario: throwing non-Error error
  Then I open the URL "http://koa/throw-non-error" and get a 500 response
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals 'non-error thrown: \\"error\\"'
  And the exception "type" equals "nodejs"
  And the event "metaData.error_handler.before" is true
  And the event "metaData.error_handler.after" is null

Scenario: A non-5XX error created with ctx.throw()
  Given I open the URL "http://koa/ctx-throw-400" and get a 400 response
  Then I should receive no errors
  When I wait to receive a session
  Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the session payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

Scenario: A handled error with ctx.bugsnag.notify()
  Then I open the URL "http://koa/handled" and get a 404 response
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://koa/handled"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
  And the event "metaData.error_handler.before" is null
  And the event "metaData.error_handler.after" is null

Scenario: adding body to request metadata
  When I POST the data "data=in_request_body" to the URL "http://koa/bodytest"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "request body"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.body.data" equals "in_request_body"
  And the event "request.httpMethod" equals "POST"
  And the event "request.httpVersion" equals "1.1"
  And the event "metaData.error_handler.before" is true
  And the event "metaData.error_handler.after" is null
