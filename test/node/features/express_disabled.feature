Feature: @bugsnag/plugin-express autoDetectErrors=false

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "express-disabled"
  And I wait for the host "express-disabled" to open port "80"

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://express-disabled/sync"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://express-disabled/sync"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: an error passed to next(err)
  Then I open the URL "http://express-disabled/next"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: a synchronous promise rejection in a route
  Then I open the URL "http://express-disabled/rejection-sync"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: an asynchronous promise rejection in a route
  Then I open the URL "http://express-disabled/rejection-async"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: a string passed to next(err)
  Then I open the URL "http://express-disabled/string-as-error"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: throwing non-Error error
  Then I open the URL "http://express-disabled/throw-non-error"
  And I wait for 5 seconds
  And I should receive no errors

Scenario: a handled error passed to req.bugsnag.notify()
  Then I open the URL "http://express-disabled/handled"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app-disabled.js"
  And the event "request.url" equals "http://express-disabled/handled"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null

Scenario: adding body to request metadata
  When I POST the data "data=in_request_body" to the URL "http://express-disabled/bodytest"
  And I wait for 5 seconds
  And I should receive no errors
