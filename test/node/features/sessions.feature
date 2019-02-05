Feature: Server side session tracking

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: calling startSession() manually
  And I run the service "sessions" with the command "node scenarios/start-session"
  And I wait to receive a request
  Then the request is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

Scenario: calling startSession() when autoCaptureSessions=false
  And I run the service "sessions" with the command "node scenarios/start-session-auto-off"
  And I wait to receive a request
  Then the request is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

Scenario: calling startSession() manually 100x
  And I run the service "sessions" with the command "node scenarios/start-session-100"
  And I wait to receive a request
  Then the request is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 100

Scenario: calling startSession() repeatedly across summary interval boundaries
  And I run the service "sessions" with the command "node scenarios/start-session-async"
  And I wait to receive 2 requests

  # first batch
  And the request is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 50
  And I discard the oldest request

  # second batch
  And the request is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 50

Scenario: calling notify() on a sessionClient
  And I run the service "sessions" with the command "node scenarios/start-session-notify"
  And I wait to receive 2 requests

  # First request is a sessions request
  Then the request is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1
  And I discard the oldest request

  # the second request should be an error report
  Then the request is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the payload field "events.0.session" is not null
  And the payload field "events.0.session.events.handled" equals 1
  And the payload field "events.0.session.events.unhandled" equals 0
