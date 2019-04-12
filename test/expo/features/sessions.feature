Feature: Expo sessions

Background:
  Given the element "metaDataFeature" is present
  And I click the element "metaDataFeature"

Scenario: Sessions can be automatically delivered
  Given the element "autoSessionButton" is present
  When I click the element "autoSessionButton"
  Then I wait to receive a request
  Then the request is valid for the session reporting API version "1" for the "Bugsnag Expo" notifier
  And the payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1

Scenario: Sessions can be manually delivered
  Given the element "manualSessionButton" is present
  When I click the element "manualSessionButton"
  Then I wait to receive a request
  Then the request is valid for the session reporting API version "1" for the "Bugsnag Expo" notifier
  And the payload has a valid sessions array
  And the sessionCount "sessionsStarted" equals 1