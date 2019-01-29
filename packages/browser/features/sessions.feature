@sessions
Feature: Session tracking

Scenario: tracking sessions by default
  When I navigate to the URL "/sessions/script/a.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the session tracking API

Scenario: autoCaptureSessions=false
  When I navigate to the URL "/sessions/script/b.html"
  And I wait for 2 seconds
  Then I should receive no requests
