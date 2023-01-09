Feature: @bugsnag/plugin-express

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I store the logs endpoint in the environment variable "BUGSNAG_LOGS_ENDPOINT"
  And I start the service "express"
  And I wait for the host "express" to open port "80"

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://express/sync/hello?a=1&b=2"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "hello"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://express/sync/hello?a=1&b=2"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
  And the event "metaData.request.path" equals "/sync/hello"
  And the event "metaData.request.query.a" equals "1"
  And the event "metaData.request.query.b" equals "2"
  And the event "metaData.request.connection" is not null

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://express/async"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "async"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "metaData.request.query" is null

Scenario: an error passed to next(err)
  Then I open the URL "http://express/next"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "next"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: a synchronous promise rejection in a route
  Then I open the URL "http://express/rejection-sync"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "reject sync"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: an asynchronous promise rejection in a route
  Then I open the URL "http://express/rejection-async"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "reject async"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

Scenario: a string passed to next(err)
  Then I open the URL "http://express/string-as-error"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "InvalidError"
  And the exception "message" matches "^express middleware received a non-error\."
  And the exception "type" equals "nodejs"

Scenario: throwing non-Error error
  Then I open the URL "http://express/throw-non-error"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "InvalidError"
  And the exception "message" matches "^express middleware received a non-error\."
  And the exception "type" equals "nodejs"

Scenario: a handled error passed to req.bugsnag.notify()
  Then I open the URL "http://express/handled"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://express/handled"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null

Scenario: adding body to request metadata
  When I POST the data "data=in_request_body" to the URL "http://express/bodytest"
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
