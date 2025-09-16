@strict_mode
Feature: Compatibility with strict mode

@skip_ie @skip_before_safari_11 @skip_before_ios_11 @skip_before_chrome_61 @skip_before_edge_16 @skip_before_firefox_60
Scenario: notifier does not error in strict mode
  When I navigate to the test URL "/strict_mode/script/notifier-does-not-error.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "InvalidError"
  And the error payload field "events.0.exceptions.0.message" equals "notify() received a non-error. See \"notify()\" tab for more detail."
