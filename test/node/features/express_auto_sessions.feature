Feature: @bugsnag/plugin-express autoTrackSessions=true

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "express"
  And I wait for the host "express" to open port "80"

Scenario: adding body to request metadata
  When I POST the data "data=in_request_body_1" to the URL "http://express/bodytest"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "request body"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.body.data" equals "in_request_body_1"
  And the event "request.httpMethod" equals "POST"
  And I discard the oldest error
  
  Then I POST the data "data=in_request_body_2" to the URL "http://express/bodytest"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "request body"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.body.data" equals "in_request_body_2"
  And the event "request.httpMethod" equals "POST"
