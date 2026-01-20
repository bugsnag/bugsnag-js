@plugin_angular

# Skipped on older Safari versions not supported by Angular 10 - Angular renders the fixture component twice, causing duplicate events to be reported
@skip_safari_10
Feature: Angular support

  @requires_promise
  @requires_set
  @requires_array_from
  Scenario Outline: basic error handler usage
    When I navigate to the test URL "/plugin_angular/angular_<version>/dist/index.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the error payload field "events.0.device.runtimeVersions.angular" is not null
    Examples:
      | version |
      | 12      |
      | 17      |
