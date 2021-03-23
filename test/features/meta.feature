Feature: Functioning test infrastructure
    For each test, there should be a functioning web server for
    processing requests and validating responses

    Scenario: Sending an event
        When I send a sample event
        Then I received 1 event upload
        Then I received 0 minidump uploads
        And the contents of event request 0 matches "sample-event2.json"

    Scenario: Sending a minidump
        When I send a sample minidump
        Then I received 1 minidump upload
        Then I received 0 event uploads
        And minidump request 0 contains a file form field named "minidump"
        And minidump request 0 contains a file form field named "event" matching "meta-minidump-event.json"

    Scenario: Got a bunch of requests
        When I send a bunch of requests
        Then the total requests received by the server matches:
            | events    | 2 |
            | sessions  | 0 |
            | minidumps | 1 |
        Then the headers of an event request contains:
            | Bugsnag-API-Key | 100a2272bd2b0ac0ab0f52715bbdc659 |
            | Content-Type    | application/json                 |
        Then the headers of every event request contains:
            | Bugsnag-API-Key | 100a2272bd2b0ac0ab0f52715bbdc659 |
            | Content-Type    | application/json                 |
        Then the contents of an event request matches "sample-event.json"
