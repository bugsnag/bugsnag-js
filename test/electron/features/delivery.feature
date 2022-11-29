Feature: Delivery of errors

    Scenario: Delivery for an oversized error is not retried
        Given I launch an app with configuration:
            | bugsnag | default |
        And I set the HTTP status code for the next "POST" request to 400
        And I click "oversized-notify"
        Then I wait to receive an error

        # Check that Bugsnag is discarding the event
        And I wait to receive 3 logs
        Then I discard the oldest log
        Then I discard the oldest log
        And the log payload field "message" equals "Event oversized (2.00 MB)"

