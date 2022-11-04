Feature: Delivery of errors

  Scenario: Delivery is attempted oversized payloads
    When I navigate to the test URL "/delivery/script/a.html"
    And I set the HTTP status code for the next "POST" request to 400
    And I wait for 5 seconds
    Then I wait to receive an error

    # Check that Bugsnag is discarding the event
    And I wait to receive a log
    And the log payload field "response" equals "Notify complete"
