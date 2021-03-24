Feature: Detecting and reporting errors

    Scenario: A crash in the main process
        Given I launch an app
        When I click "main-process-crash"
        Then the app crashed

    Scenario Outline: An unhandled promise rejection in the main process
        Given I launch an app with configuration:
            | bugsnag | <config> |
        When I click "main-process-unhandled-promise-rejection"
        Then the total requests received by the server matches:
            | events  | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 100a2272bd2b0ac0ab0f52715bbdc659 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "main/unhandled-rejection/<config>.json"

        Examples:
            | config          |
            | default         |
            | complex-config  |

    Scenario Outline: An uncaught exception in the main process
        Given I launch an app with configuration:
            | bugsnag | <config> |
        When I click "main-process-uncaught-exception"
        Then the total requests received by the server matches:
            | events  | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 100a2272bd2b0ac0ab0f52715bbdc659 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "main/uncaught-exception/<config>.json"

        Examples:
            | config          |
            | default         |
            | complex-config  |

    Scenario Outline: An event occurs when reporting is disabled
        Given I launch an app with configuration:
            | bugsnag | <config> |
        When I click "<link>"
        Then the total requests received by the server matches:
            | events  | 0        |

        Examples:
            | config                       | link                                     |
            | disable-uncaught-exceptions  | main-process-uncaught-exception          |
            | disable-unhandled-rejections | main-process-unhandled-promise-rejection |

    Scenario: An uncaught exception in the renderer
        Given I launch an app
        When I click "renderer-uncaught-exception"

    Scenario: An unhandled promise rejection in the renderer
        Given I launch an app
        When I click "renderer-unhandled-promise-rejection"
