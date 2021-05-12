Feature: Detecting and reporting errors

    Scenario Outline: Sending a handled error
        Given I launch an app with configuration:
            | bugsnag | <config> |
        When I click "custom-breadcrumb"
        And I click "<type>-notify"
        Then the total requests received by the server matches:
            | events  | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "<type>/handled-error/<config>.json"

        Examples:
            | config          | type     |
            | default         | renderer |
            | complex-config  | renderer |
            | default         | main     |
            | complex-config  | main     |

    Scenario Outline: An unhandled promise rejection in the main process
        Given I launch an app with configuration:
            | bugsnag | <config> |
        When I click "main-process-unhandled-promise-rejection"
        Then the total requests received by the server matches:
            | events   | 1        |
            | sessions | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
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
            | events   | 1        |
            | sessions | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
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
            | events   | 0        |
            | sessions | 1        |

        Examples:
            | config                       | link                                     |
            | disable-uncaught-exceptions  | main-process-uncaught-exception          |
            | disable-unhandled-rejections | main-process-unhandled-promise-rejection |

    Scenario Outline: An uncaught exception in the renderer
        Given I launch an app with configuration:
            | bugsnag | <config> |
        When I click "renderer-uncaught-exception"
        Then the total requests received by the server matches:
            | events   | 1        |
            | sessions | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "renderer/uncaught-exception/<config>.json"

        Examples:
            | config          |
            | default         |
            | complex-config  |

    Scenario Outline: An unhandled promise rejection in the renderer
        Given I launch an app with configuration:
            | bugsnag | <config> |
        When I click "renderer-unhandled-promise-rejection"
        Then the total requests received by the server matches:
            | events   | 1        |
            | sessions | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "renderer/unhandled-rejection/<config>.json"

        Examples:
            | config          |
            | default         |
            | complex-config  |

    Scenario Outline: An exception in an inline script tag in a renderer
        Given I launch an app with configuration:
            | bugsnag | <config> |
        When I click "inline-script-exception"
        Then the total requests received by the server matches:
            | events   | 1        |
            | sessions | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "renderer/inline-script-exception/<config>.json"

        Examples:
            | config         |
            | default        |
            | complex-config |
