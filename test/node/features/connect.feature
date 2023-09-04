Feature: @bugsnag/plugin-express (connect)

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "connect"
  And I wait for the host "connect" to open port "80"

Scenario: a synchronous thrown error in a route
  Then I open the URL "http://connect/sync"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "sync"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://connect/sync"
  And the event "request.httpMethod" equals "GET"

Scenario: an asynchronous thrown error in a route
  Then I open the URL "http://connect/async"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "async"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://connect/async"
  And the event "request.httpMethod" equals "GET"

Scenario: an error passed to next(err)
  Then I open the URL "http://connect/next"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "next"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://connect/next"
  And the event "request.httpMethod" equals "GET"

Scenario: a synchronous promise rejection in a route
  Then I open the URL "http://connect/rejection-sync"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "reject sync"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://connect/rejection-sync"
  And the event "request.httpMethod" equals "GET"

Scenario: an asynchronous promise rejection in a route
  Then I open the URL "http://connect/rejection-async"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "reject async"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://connect/rejection-async"
  And the event "request.httpMethod" equals "GET"

Scenario: a string passed to next(err)
  Then I open the URL "http://connect/string-as-error"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "InvalidError"
  And the exception "message" matches "^express middleware received a non-error\."
  And the exception "type" equals "nodejs"
  And the event "request.url" equals "http://connect/string-as-error"
  And the event "request.httpMethod" equals "GET"

Scenario: throwing non-Error error
  Then I open the URL "http://connect/throw-non-error"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "InvalidError"
  And the exception "message" matches "^express middleware received a non-error\."
  And the exception "type" equals "nodejs"
  And the event "request.url" equals "http://connect/throw-non-error"
  And the event "request.httpMethod" equals "GET"