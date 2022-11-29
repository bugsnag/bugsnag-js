Feature: Delivery of errors

  @skip_ie_10
  Scenario: Delivery is attempted oversized payloads
    When I set the HTTP status code for the next "POST" request to 400
    And I navigate to the test URL "/delivery/script/a.html"
    And I wait for 5 seconds
    Then I wait to receive an error

    # Check that Bugsnag is discarding the event
    And I wait to receive 2 logs
    Then I discard the oldest log
    And the log payload field "message" equals "Event oversized (2.00 MB)"
