@plugin_angular

# Skipped on older Safari versions not supported by Angular 10 - Angular renders the fixture component twice, causing duplicate events to be reported
@skip_safari_10 @skip_before_ios_12
Feature: Angular support

Scenario Outline: basic error handler usage
  When I navigate to the test URL "/plugin_angular/angular_<version>/dist/index.html"
  And the test should run in this browser
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  Examples:
    | version |
    | 12      |
    | 17      |
