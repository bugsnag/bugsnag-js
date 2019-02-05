Feature: @bugsnag/plugin-restify

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "restify"
  And I wait for the host "restify" to open port "80"

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://restify/sync"
  And I wait to receive a request
  Then the request is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "sync"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://restify/sync"
  And the event "request.httpMethod" equals "GET"

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://restify/async"
  And I wait to receive a request
  Then the request is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "async"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: an error passed to next(err)
  Then I open the URL "http://restify/next"
  And I wait to receive a request
  Then the request is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "next"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: throwing non-Error error
  Then I open the URL "http://restify/throw-non-error"
  And I wait to receive a request
  Then the request is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" matches "^Handled a non-error\."
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "node_modules/@bugsnag/plugin-restify/dist/bugsnag-restify.js"

Scenario: an explicit 404
  Then I open the URL "http://restify/not-found"
  And I wait for 1 second
  Then I should receive no requests

Scenario: an explicit internal server error
  Then I open the URL "http://restify/internal"
  And I wait to receive a request
  Then the request is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "InternalServerError"
  And the exception "message" equals "oh noes!"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"