Feature: Native Errors

    Scenario: A minidump is uploaded on native error
        When I launch an app
        And I click "main-process-crash"
        Then I launch an app
        Then the total requests received by the server matches:
            | minidumps | 1 |
        And minidump request 0 contains a file form field named "upload_file_minidump"
        And minidump request 0 contains a form field named "event"

    Scenario: Minidumps are retried when the network becomes available
        When I launch an app
        And I click "main-process-crash"
        Given the server is unreachable
        And I launch an app
        Then the total requests received by the server matches:
            | events    | 0 |
            | minidumps | 0 |
        When the server becomes reachable
        And the app gains network connectivity
        Then the total requests received by the server matches:
            | minidumps | 1 |
            | events    | 0 |
