Feature: @bugsnag/plugin-koa (koa v1.x support) autoDetectErrors=false

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "koa-1x-disabled"
  And I wait for the host "koa-1x-disabled" to open port "80"

Scenario: a synchronous thrown error in a route
  Given I open the URL "http://koa-1x-disabled/err"
  Then I should receive no errors

Scenario: An error created with with ctx.throw()
  Given I open the URL "http://koa-1x-disabled/ctx-throw"
  Then I should receive no errors

Scenario: an error thrown before the requestHandler middleware
  Given I open the URL "http://koa-1x-disabled/error-before-handler"
  Then I should receive no errors

Scenario: throwing non-Error error
  Given I open the URL "http://koa-1x-disabled/throw-non-error"
  Then I should receive no errors

Scenario: A non-5XX error created with ctx.throw()
  Given I open the URL "http://koa-1x-disabled/ctx-throw-400"
  Then I should receive no errors
  When I wait to receive a session
  Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the session payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

Scenario: A handled error with ctx.bugsnag.notify()
  Given I open the URL "http://koa-1x-disabled/handled"
  When I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app-disabled.js"
  And the event "request.url" equals "http://koa-1x-disabled/handled"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
