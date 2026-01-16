@sessions
Feature: Session tracking

Scenario: tracking sessions by default
  When I navigate to the test URL "/sessions/script/default.html"
  Then I wait to receive a session
  And the session is a valid browser payload for the session tracking API

Scenario: autoTrackSessions=false
  When I navigate to the test URL "/sessions/script/sessions_disabled.html"
  Then I should receive no sessions
