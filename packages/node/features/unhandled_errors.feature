Feature: Reporting unhandled errors

Background:
  Given I set environment variable "BUGSNAG_API_KEY" to "9c2151b65d615a3a95ba408142c8698f"
  And I configure the bugsnag notify endpoint

Scenario Outline: reporting thrown exception which is not caught
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "unhandled"
  And I run the service "unhandled" with the command "node scenarios/thrown-error-not-caught"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledException"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "not handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/thrown-error-not-caught.js"
  And the "lineNumber" of stack frame 0 equals 10

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: not reporting uncaughtExceptions when autoNotify is off
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "unhandled"
  And I run the service "unhandled" with the command "node scenarios/thrown-error-not-caught-auto-notify-off"
  And I wait for 1 second
  Then I should receive 0 requests

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: reporting unhandled promise rejections
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "unhandled"
  And I run the service "unhandled" with the command "node scenarios/unhandled-promise-rejection"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "not handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/unhandled-promise-rejection.js"
  And the "lineNumber" of stack frame 0 equals 10

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: reporting unhandled promise rejections
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "unhandled"
  And I run the service "unhandled" with the command "node scenarios/unhandled-promise-rejection"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "not handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/unhandled-promise-rejection.js"
  And the "lineNumber" of stack frame 0 equals 10

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: not reporting unhandledRejections when autoNotify is off
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "unhandled"
  And I run the service "unhandled" with the command "node scenarios/unhandled-promise-rejection-auto-notify-off"
  And I wait for 1 second
  Then I should receive 0 requests

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: using contextualize to add context to an error
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "unhandled"
  And I run the service "unhandled" with the command "node scenarios/contextualize"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledException"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "ENOENT: no such file or directory, open 'does not exist'"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/contextualize.js"
  And the "lineNumber" of stack frame 0 equals 12
  And the event "metaData.subsystem.name" equals "fs reader"
  And the event "metaData.subsystem.widgetsAdded" equals "cat,dog,mouse"

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |
