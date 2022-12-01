Feature: Delivery of errors

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  And I store the logs endpoint in the environment variable "BUGSNAG_LOGS_ENDPOINT"

Scenario: Delivery for an oversized error is not retried
  Given I start the service "express"
  And I wait for the host "express" to open port "80"
  And I set the HTTP status code for the next "POST" request to 400
  When I open the URL "http://express/oversized"
  And I wait for 5 seconds
  Then I wait to receive an error

  # Check that Bugsnag is discarding the event based on the log output
  And I wait to receive 3 logs
  Then I discard the oldest log
  Then I discard the oldest log
  And the log payload field "message" equals "Event oversized (2.01 MB)"
  
  # Check that resend is not attempted next load (e.g. for when persistence/retry is supported in node)
  Then I stop all docker services
  And I discard the oldest error
  And I start the service "express"
  And I wait for the host "express" to open port "80"
  Then I should receive no errors