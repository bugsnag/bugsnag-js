Feature: lastRunInfo

   # Skipped on macOS pending PLAT-12276
  @not_macos
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

   # Skipped on macOS pending PLAT-12276
  @not_macos
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
