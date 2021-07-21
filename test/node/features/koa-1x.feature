Feature: @bugsnag/plugin-koa (koa v1.x support)

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "koa-1x"
  And I wait for the host "koa-1x" to open port "80"

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://koa-1x/err"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "noooop"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://koa-1x/err"
  And the event "request.httpMethod" equals "GET"

Scenario: An error created with with ctx.throw()
  Then I open the URL "http://koa-1x/ctx-throw"
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

Scenario: an error thrown before the requestHandler middleware
  Then I open the URL "http://koa-1x/error-before-handler"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "nope"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: throwing non-Error error
  Then I open the URL "http://koa-1x/throw-non-error"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "non-error thrown: error"
  And the exception "type" equals "nodejs"

Scenario: A non-5XX error created with ctx.throw()
  When I open the URL "http://koa-1x/ctx-throw-400"
  And I wait to receive a session
  Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the session payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

Scenario: A handled error with ctx.bugsnag.notify()
  Then I open the URL "http://koa-1x/handled"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://koa-1x/handled"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
