@skip_before_node_18
Feature: @bugsnag/plugin-cloudflare-workers

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I start the service "cloudflare-worker"
  And I wait for the host "cloudflare-worker" to open port "8787"

Scenario: A handled error
  Then I open the URL "http://cloudflare-worker/handled" and get a 200 response with body "Hello World!"
  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://cloudflare-worker/handled"
  And the event "request.httpMethod" equals "GET"