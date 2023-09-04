@skip_node_18
Feature: @bugsnag/plugin-restify autoDetectErrors=false

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "restify-disabled"
  And I wait for the host "restify-disabled" to open port "80"

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://restify-disabled/sync"
  And I should receive no errors

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://restify-disabled/async"
  And I should receive no errors

Scenario: an error passed to next(err)
  Then I open the URL "http://restify-disabled/next"
  And I should receive no errors

Scenario: throwing non-Error error
  Then I open the URL "http://restify-disabled/throw-non-error"
  And I should receive no errors

Scenario: an explicit 404
  When I open the URL "http://restify-disabled/not-found"
  And I wait to receive a session
  Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the session payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

Scenario: an explicit internal server error
  Then I open the URL "http://restify-disabled/internal"
  And I should receive no errors

Scenario: a handled error passed to req.bugsnag.notify()
  Then I open the URL "http://restify-disabled/handled"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app-disabled.js"
  And the event "request.url" equals "http://restify-disabled/handled"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
