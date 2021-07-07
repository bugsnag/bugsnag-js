Feature: @bugsnag/plugin-koa autoDetectErrors=false

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "koa-disabled"
  And I wait for the host "koa-disabled" to open port "80"

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://koa-disabled/err"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://koa-disabled/async-err"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: An error created with with ctx.throw()
  Then I open the URL "http://koa-disabled/ctx-throw"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: an error thrown before the requestHandler middleware
  Then I open the URL "http://koa-disabled/error-before-handler"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: throwing non-Error error
  Then I open the URL "http://koa-disabled/throw-non-error"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: A non-5XX error created with ctx.throw()
  When I open the URL "http://koa-disabled/ctx-throw-400"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: A handled error with ctx.bugsnag.notify()
  Then I open the URL "http://koa-disabled/handled"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app-disabled.js"
  And the event "request.url" equals "http://koa-disabled/handled"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null

Scenario: adding body to request metadata
  When I POST the data "data=in_request_body" to the URL "http://koa-disabled/bodytest"
  And I wait for 5 seconds
  And I should receive no errors
