Feature: Expo sessions

Background:
  Given the element "sessions" is present
  And I click the element "sessions"

Scenario: Sessions can be automatically delivered
  Given the element "autoSessionButton" is present
  When I click the element "autoSessionButton"
  Then I wait to receive a session
  And the session "bugsnag-api-key" header equals "645470b8c7f62177e1a723e26c9a48d7"
  And the session "bugsnag-payload-version" header equals one of:
    | 1   |
    | 1.0 |
  And the session "Content-Type" header equals one of:
    | application/json |
    | application/json; charset=utf-8 |
  And the session "Bugsnag-Sent-At" header is a timestamp
  And the session payload field "notifier.name" equals "Bugsnag Expo"
  And the session payload field "notifier.url" is not null
  And the session payload field "notifier.version" is not null
  And the session payload field "app" is not null
  And the session payload field "device" is not null
  And the session payload has a valid sessions array
  And the session Bugsnag-Integrity header is valid

Scenario: Sessions can be manually delivered
  Given the element "manualSessionButton" is present
  When I click the element "manualSessionButton"
  Then I wait to receive a session
  And the session "bugsnag-api-key" header equals "645470b8c7f62177e1a723e26c9a48d7"
  And the session "bugsnag-payload-version" header equals one of:
    | 1   |
    | 1.0 |
  And the session "Content-Type" header equals one of:
    | application/json |
    | application/json; charset=utf-8 |
  And the session "Bugsnag-Sent-At" header is a timestamp
  And the session payload field "notifier.name" equals "Bugsnag Expo"
  And the session payload field "notifier.url" is not null
  And the session payload field "notifier.version" is not null
  And the session payload field "app" is not null
  And the session payload field "device" is not null
  And the session payload has a valid sessions array
  And the session Bugsnag-Integrity header is valid
