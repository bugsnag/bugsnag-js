Feature: Functioning test infrastructure
    For each test, there should be a functioning web server for
    processing requests and validating responses

    Scenario: Sending an event
        When I send a sample event
        Then I received 1 event upload
        Then I received 0 minidump uploads
        And the contents of event request 0 matches "meta-event.json"

    Scenario: Sending a minidump
        When I send a sample minidump
        Then I received 1 minidump upload
        Then I received 0 event uploads
        And minidump request 0 contains a file form field named "minidump"
        And minidump request 0 contains a file form field named "event" matching "meta-minidump-event.json"
