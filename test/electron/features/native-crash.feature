Feature: Native Errors

    Scenario: A minidump is uploaded on native error
        When I launch an app
        And I click "main-process-crash"
        Then I launch an app
        Then the total requests received by the server matches:
            | minidumps | 1 |
        And minidump request 0 contains a file form field named "upload_file_minidump"
        And minidump request 0 contains a form field named "event" matching "minidump-event.json"

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

    Scenario: Last run info consecutive crashes on-launch
      # Crash the app during launch - twice
      Given I launch an app with configuration:
        | bugsnag | zero-launch-duration |
      And I click "main-process-crash"
      And I wait 2 seconds

      Then I launch an app with configuration:
        | bugsnag | zero-launch-duration |
      And I click "main-process-crash"
      And I wait 2 seconds

      Then I launch an app
      And I click "last-run-info-breadcrumb"
      And I click "main-process-uncaught-exception"
      Then the total requests received by the server matches:
        | events   | 1        |
      Then the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
      Then the contents of an event request matches "launch-info/consecutive-launch-crashes.json"

    Scenario: Last run info after crash
      Given I launch an app with configuration:
        | bugsnag | zero-launch-duration |
      And I click "mark-launch-complete"
      And I click "main-process-crash"
      And I wait 2 seconds
      Then I launch an app
      And I click "last-run-info-breadcrumb"
      And I click "main-process-uncaught-exception"
      Then the total requests received by the server matches:
        | events   | 1        |
      Then the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
      Then the contents of an event request matches "launch-info/crashed.json"
