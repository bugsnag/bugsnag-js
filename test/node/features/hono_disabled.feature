@skip_before_node_18
Feature: hono-disabled autoDetectErrors=false

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "hono-disabled"
  And I wait for the host "hono-disabled" to open port "80"

Scenario: A handled error
  Then I open the URL "http://hono-disabled/handled"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://hono-disabled/sync"
  And I should receive no errors

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://hono-disabled/async" tolerating any error
  And I should receive no errors

Scenario: a synchronous promise rejection in a route
  Then I open the URL "http://hono-disabled/rejection-sync"
  And I should receive no errors

Scenario: an asynchronous promise rejection in a route
  Then I open the URL "http://hono-disabled/rejection-async"
  And I should receive no errors

Scenario: throwing non-Error error
  Then I open the URL "http://hono-disabled/throw-non-error"
  And I should receive no errors