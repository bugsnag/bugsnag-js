@plugin_react @skip_chrome_47 @skip_chrome_53
Feature: React support

  @requires_set
  Scenario: basic error boundary usage
    When I navigate to the test URL "/plugin_react/webpack4/index.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "borked"
    And the event "metaData.react.componentStack" is not null
