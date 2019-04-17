Feature: Expo sessions

Background:
  Given the element "sessions" is present
  And I click the element "sessions"

Scenario: Sessions can be automatically delivered
  Given the element "autoSessionButton" is present
  When I click the element "autoSessionButton"
  Then I wait to receive a request
  And the "bugsnag-api-key" header equals "645470b8c7f62177e1a723e26c9a48d7"
  And the "bugsnag-payload-version" header equals one of:
    | 1   |
    | 1.0 |
  And the "Content-Type" header equals one of:
    | application/json |
    | application/json; charset=utf-8 |
  And the "Bugsnag-Sent-At" header is a timestamp
  And the payload field "notifier.name" equals "Bugsnag Expo"
  And the payload field "notifier.url" is not null
  And the payload field "notifier.version" is not null
  And the payload field "app" is not null
  And the payload field "device" is not null
  And the payload has a valid sessions array

Scenario: Sessions can be manually delivered
  Given the element "manualSessionButton" is present
  When I click the element "manualSessionButton"
  Then I wait to receive a request
  And the "bugsnag-api-key" header equals "645470b8c7f62177e1a723e26c9a48d7"
  And the "bugsnag-payload-version" header equals one of:
    | 1   |
    | 1.0 |
  And the "Content-Type" header equals one of:
    | application/json |
    | application/json; charset=utf-8 |
  And the "Bugsnag-Sent-At" header is a timestamp
  And the payload field "notifier.name" equals "Bugsnag Expo"
  And the payload field "notifier.url" is not null
  And the payload field "notifier.version" is not null
  And the payload field "app" is not null
  And the payload field "device" is not null
  And the payload has a valid sessions array