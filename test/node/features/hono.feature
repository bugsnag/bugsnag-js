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
  And the exception "type" equals "nodejs"
#  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://hono/handled"
  And the event "request.httpMethod" equals "GET"
  
Scenario: a synchronous thrown error in a route
  Then I open the URL "http://hono/sync" tolerating any error
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "type" equals "nodejs"
#  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://hono/sync"

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://hono/async" tolerating any error
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "type" equals "nodejs"
#  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://hono/async"
  And the event "request.httpMethod" equals "GET"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the event "severityReason.attributes.framework" equals "Hono"

Scenario: an error passed to next(err)
  Then I open the URL "http://hono/next"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "type" equals "nodejs"
#  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: a synchronous promise rejection in a route
  Then I open the URL "http://hono/rejection-sync"
  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the exception "type" equals "nodejs"
#  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://hono/rejection-sync"
  And the event "request.httpMethod" equals "GET"

Scenario: an asynchronous promise rejection in a route
  Then I open the URL "http://hono/rejection-async"
  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the exception "type" equals "nodejs"
#  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://hono/rejection-async"
  And the event "request.httpMethod" equals "GET"


Scenario: a string passed to next(err)
  Then I open the URL "http://hono/string-as-error"
  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "type" equals "nodejs"
#  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: throwing non-Error error
  Then I open the URL "http://hono/throw-non-error"
  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "type" equals "nodejs"
#  And the "file" of stack frame 0 equals "scenarios/app.js"