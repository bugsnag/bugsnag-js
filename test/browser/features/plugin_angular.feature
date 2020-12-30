@plugin_angular
Feature: Angular support

Scenario: basic error handler usage
  When I navigate to the test URL "/plugin_angular/ng/dist/index.html"
  And the test should run in this browser
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.angular" is not null
