Feature: @bugsnag/plugin-koa

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "koa"
  And I wait for the host "koa" to open port "80"

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://koa/err"
  And I wait to receive a request
  Then the request is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "noooop"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://koa/err"
  And the event "request.httpMethod" equals "GET"

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://koa/async-err"
  And I wait to receive a request
  Then the request is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "async noooop"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: An error created with with ctx.throw()
  Then I open the URL "http://koa/ctx-throw"
  And I wait to receive a request
  Then the request is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "InternalServerError"
  And the exception "message" equals "thrown"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "node_modules/koa/lib/context.js"
  And the "file" of stack frame 1 equals "scenarios/app.js"

Scenario: an error thrown before the requestHandler middleware
  Then I open the URL "http://koa/error-before-handler"
  And I wait to receive a request
  Then the request is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "nope"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: throwing non-Error error
  Then I open the URL "http://koa/throw-non-error"
  And I wait to receive a request
  Then the request is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" matches "^Handled a non-error\."
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "node_modules/@bugsnag/plugin-koa/dist/bugsnag-koa.js"
