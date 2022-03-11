Feature: @bugsnag/plugin-restify

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "restify"
  And I wait for the host "restify" to open port "80"

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://restify/sync"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "sync"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://restify/sync"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://restify/async"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "async"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: an error passed to next(err)
  Then I open the URL "http://restify/next"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "next"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: throwing non-Error error
  Then I open the URL "http://restify/throw-non-error"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "InvalidError"
  And the exception "message" matches "^restify middleware received a non-error\."
  And the exception "type" equals "nodejs"

Scenario: an explicit 404
  When I open the URL "http://restify/not-found"
  And I wait to receive a session
  Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the session payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

Scenario: an explicit internal server error
  Then I open the URL "http://restify/internal"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "InternalServerError"
  And the exception "message" equals "oh noes!"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: a handled error passed to req.bugsnag.notify()
  Then I open the URL "http://restify/handled"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://restify/handled"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null

Scenario: adding body to request metadata
  When I POST the data "data=in_request_body" to the URL "http://restify/bodytest"
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