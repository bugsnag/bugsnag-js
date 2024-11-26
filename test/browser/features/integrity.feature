@skip_ie_11 @skip_ios_10 @skip_safari_10 @skip_safari_16 @skip_edge_17 @skip_chrome_43
Feature: Bugsnag-Integrity header

Scenario: Integrity headers are set when setPayloadChecksums is true
  When I navigate to the test URL "/integrity/script/enabled.html"
  And I wait to receive an error
  And I wait to receive a session
  Then the error is a valid browser payload for the error reporting API
  And the session "bugsnag-integrity" header matches the regex "^sha1 (\d|[abcdef]){40}$"
  And the error "bugsnag-integrity" header matches the regex "^sha1 (\d|[abcdef]){40}$"

Scenario: Integrity headers are not set when setPayloadChecksums is false
  When I navigate to the test URL "/integrity/script/disabled.html"
  And I wait to receive an error
  And I wait to receive a session
  Then the error is a valid browser payload for the error reporting API
  And the session "bugsnag-integrity" header is not present
  And the error "bugsnag-integrity" header is not present

