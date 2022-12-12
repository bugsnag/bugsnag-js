Feature: Delivery of errors

    Scenario: Delivery for an oversized error is not retried
        Given I launch an app
        And I set the HTTP status code for the next "POST" request to 400
        And I click "main-oversized"
        Then the total requests received by the server matches:
            | events  | 1        |
        And the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        # Check that resend is not attempted next load (e.g. for when persistence/retry is supported in node)
        When I close the app
        And I discard the oldest error
        And I launch the app
        Then I should receive no errors
        Then the total requests received by the server matches:
            | events   | 0 |
            | sessions | 0 |