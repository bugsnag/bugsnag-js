Feature: Server side session tracking

Background:
  Given I set environment variable "BUGSNAG_API_KEY" to "9c2151b65d615a3a95ba408142c8698f"
  And I configure the bugsnag notify endpoint
  And I configure the bugsnag sessions endpoint

Scenario Outline: calling startSession() manually
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "sessions"
  And I run the service "sessions" with the command "node scenarios/start-session"
  And I wait for 2 seconds
  Then I should receive a request
  And the request used the Node notifier
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the request is a valid for the session tracking API
  And the payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: calling startSession() when autoCaptureSessions=false
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "sessions"
  And I run the service "sessions" with the command "node scenarios/start-session-auto-off"
  And I wait for 2 seconds
  Then I should receive a request
  And the request used the Node notifier
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the request is a valid for the session tracking API
  And the payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: calling startSession() manually 100x
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "sessions"
  And I run the service "sessions" with the command "node scenarios/start-session-100"
  And I wait for 2 seconds
  Then I should receive a request
  And the request used the Node notifier
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the request is a valid for the session tracking API
  And the payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 100

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: calling startSession() repeatedly across summary interval boundaries
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "sessions"
  And I run the service "sessions" with the command "node scenarios/start-session-async"
  And I wait for 3 seconds
  Then I should receive 2 requests
  And the request used the Node notifier

  # first batch
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f" for request 0
  And request 0 is a valid for the session tracking API
  And the payload has a valid sessions array for request 0
  And the sessionCount "sessionsStarted" equals 50 for request 0

  # second batch
  And request 1 is a valid for the session tracking API
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f" for request 1
  And the payload has a valid sessions array for request 1
  And the sessionCount "sessionsStarted" equals 50 for request 1

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: calling notify() on a sessionClient
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "sessions"
  And I run the service "sessions" with the command "node scenarios/start-session-notify"
  And I wait for 3 seconds
  Then I should receive 2 requests
  And the request used the Node notifier
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the request is a valid for the session tracking API
  And the payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1
  # the second request should be an error report
  And the payload field "events.0.session" is not null for request 1
  And the payload field "events.0.session.events.handled" equals 1 for request 1
  And the payload field "events.0.session.events.unhandled" equals 0 for request 1

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |
