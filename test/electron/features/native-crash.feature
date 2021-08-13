Feature: Native Errors

  Scenario: A minidump is uploaded on native error
    When I launch an app
    Then the total requests received by the server matches:
      | events    | 0 |
      | minidumps | 0 |
      | sessions  | 1 |

    When I click "main-process-crash"
    And I launch an app
    Then the total requests received by the server matches:
      | events    | 0 |
      | minidumps | 1 |
      | sessions  | 2 |
    And minidump request 0 contains a file form field named "upload_file_minidump"
    And minidump request 0 contains a form field named "event" matching "minidump-event.json"

  Scenario: A native error occurs after a handled event
    When I launch an app
    And I click "custom-breadcrumb"
    And I click "main-notify"
    Then the total requests received by the server matches:
      | events    | 1 |
      | minidumps | 0 |
      | sessions  | 1 |

    When I click "main-process-crash"
    And I launch an app
    Then the total requests received by the server matches:
      | events    | 1 |
      | minidumps | 1 |
      | sessions  | 2 |
    And the contents of an event request matches "main/handled-error/default.json"
    And minidump request 0 contains a file form field named "upload_file_minidump"
    And minidump request 0 contains a form field named "event" matching "minidump-plus-handled-event.json"

  Scenario: Minidumps are retried when the network becomes available
    When I launch an app
    Then the total requests received by the server matches:
      | minidumps | 0 |
      | events    | 0 |
      | sessions  | 1 |

    When I click "main-process-crash"
    And I launch an app with no network
    Then the total requests received by the server matches:
      | minidumps | 0 |
      | events    | 0 |
      | sessions  | 1 |

    When the app gains network connectivity
    Then the total requests received by the server matches:
      | events    | 0 |
      | minidumps | 1 |
      | sessions  | 2 |

  Scenario: Minidumps are enqueued until next launch when the server is offline
    Given the server is unreachable
    When I launch an app
    Then the total requests received by the server matches:
      | minidumps | 0 |
      | events    | 0 |
      | sessions  | 0 |

    When I click "main-process-crash"
    And I launch an app
    Then the total requests received by the server matches:
      | minidumps | 0 |
      | events    | 0 |
      | sessions  | 0 |

    When I click "main-process-crash"
    And the server becomes reachable
    And I launch an app
    Then the total requests received by the server matches:
      | minidumps | 2 |
      | events    | 0 |
      | sessions  | 3 |

  Scenario: Minidumps are queued for delivery until the network is available
    When I launch an app with no network
    And I click "main-process-crash"
    And I launch an app with no network
    Then the total requests received by the server matches:
      | minidumps | 0 |
      | events    | 0 |
      | sessions  | 0 |

    When I click "main-process-crash"
    And I launch an app with no network
    Then the total requests received by the server matches:
      | minidumps | 0 |
      | events    | 0 |
      | sessions  | 0 |

    When I click "main-process-crash"
    And I launch an app
    Then the total requests received by the server matches:
      | minidumps | 3 |
      | events    | 0 |
      | sessions  | 4 |
