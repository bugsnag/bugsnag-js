Feature: Native Errors

  Scenario: A minidump is uploaded on native error
    When I launch an app
    And I wait for 1 session upload
    And I click "main-process-crash"
    Then I launch an app
    And I wait for 2 session uploads
    Then the total requests received by the server matches:
      | minidumps | 1 |
      | sessions  | 2 |
    And minidump request 0 contains a file form field named "upload_file_minidump"
    And minidump request 0 contains a form field named "event" matching "minidump-event.json"

  Scenario: Minidumps are retried when the network becomes available
    When I launch an app
    And I wait for 1 session upload
    And I click "main-process-crash"
    Given the server is unreachable
    And I launch an app
    Then the total requests received by the server matches:
      | events    | 0 |
      | minidumps | 0 |
      | sessions  | 1 |
    When the server becomes reachable
    And the app gains network connectivity
    Then the total requests received by the server matches:
      | minidumps | 1 |
      | events    | 0 |
      | sessions  | 1 |

  Scenario: Minidumps are queued for delivery until the network is available
    Given the server is unreachable
    When I launch an app
    And I click "main-process-crash"
    When I launch an app
    And I click "main-process-crash"
    When I launch an app
    And I click "main-process-crash"
    And I launch an app
    When the server becomes reachable
    And the app gains network connectivity
    Then the total requests received by the server matches:
      | minidumps | 3 |
      | events    | 0 |
