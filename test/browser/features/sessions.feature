@sessions
Feature: Session tracking

Scenario: tracking sessions by default
  When I navigate to the test URL "/sessions/script/a.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the session tracking API

Scenario: autoTrackSessions=false
  When I navigate to the test URL "/sessions/script/b.html"
  And I wait for 2 seconds
  Then I should receive no requests
