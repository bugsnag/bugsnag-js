Feature: Native Errors

  Scenario: A minidump is uploaded on native error
    When I launch an app
    And I wait for 1 session upload
    And I click "main-process-crash"
    And I launch an app
    Then the total requests received by the server matches:
      | minidumps | 1 |
      | sessions  | 2 |
    Then minidump request 0 contains a file form field named "upload_file_minidump"
    Then minidump request 0 contains a form field named "event" matching "minidump-event.json"

  Scenario: Minidumps are retried when the network becomes available
    Given I launch an app
    And I wait for 1 session upload
    And I click "main-process-crash"
    And the server is unreachable
    And I launch an app with no network
    And the server becomes reachable
    And the app gains network connectivity
    Then the total requests received by the server matches:
      | events    | 0 |
      | minidumps | 1 |
      | sessions  | 2 |

  Scenario: Minidumps are queued for delivery until the network is available
    Given the server is unreachable
    When I launch an app
    And I click "main-process-crash"
    And I launch an app
    And I click "main-process-crash"
    And I launch an app
    And I click "main-process-crash"
    And I launch an app
    And the server becomes reachable
    And the app gains network connectivity
    Then the total requests received by the server matches:
      | minidumps | 3 |
      | events    | 0 |
