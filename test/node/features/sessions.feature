Feature: Server side session tracking

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: calling startSession() manually
  And I run the service "sessions" with the command "node scenarios/start-session"
  And I wait to receive a session
  Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the session payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

Scenario: calling startSession() when autoTrackSessions=false
  And I run the service "sessions" with the command "node scenarios/start-session-auto-off"
  And I wait to receive a session
  Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the session payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

Scenario: calling startSession() manually 100x
  And I run the service "sessions" with the command "node scenarios/start-session-100"
  And I wait to receive a session
  Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the session payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 100

Scenario: calling startSession() repeatedly across summary interval boundaries
  And I run the service "sessions" with the command "node scenarios/start-session-async"
  And I wait to receive 2 sessions

  # first batch
  And the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the session payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 50
  And I discard the oldest session

  # second batch
  And the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the session payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 50

Scenario: calling notify() on a sessionClient
  And I run the service "sessions" with the command "node scenarios/start-session-notify"
  And I wait to receive a session
  And I wait to receive an error

  # First request is a sessions request
  Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the session payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

  # the second request should be an error report
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the error payload field "events.0.session" is not null
  And the error payload field "events.0.session.events.handled" equals 1
  And the error payload field "events.0.session.events.unhandled" equals 0
