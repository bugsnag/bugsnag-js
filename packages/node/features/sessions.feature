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

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |
