Feature: Reporting handled errors

Background:
  Given I set environment variable "BUGSNAG_API_KEY" to "9c2151b65d615a3a95ba408142c8698f"
  And I configure the bugsnag notify endpoint

Scenario Outline: calling notify() with an error
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "handled"
  And I run the service "handled" with the command "node scenarios/notify"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the event "severityReason.type" equals "handledException"
  And the exception "errorClass" equals "Error"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/notify.js"
  And the "lineNumber" of stack frame 0 equals 10

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: calling notify() with am error from try/catch
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "handled"
  And I run the service "handled" with the command "node scenarios/notify-try-catch"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the event "severityReason.type" equals "handledException"
  And the exception "errorClass" equals "ReferenceError"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/notify-try-catch.js"
  And the "lineNumber" of stack frame 0 equals 11

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: calling notify with an error from Promise.catch()
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "handled"
  And I run the service "handled" with the command "node scenarios/notify-promise-catch"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the event "severityReason.type" equals "handledException"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "bad things"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/notify-promise-catch.js"
  And the "lineNumber" of stack frame 0 equals 17

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: using intercept to notify an async error
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "handled"
  And I run the service "handled" with the command "node scenarios/intercept-callback"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the event "severityReason.type" equals "callbackErrorIntercept"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "ENOENT: no such file or directory, open 'does not exist'"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/intercept-callback.js"
  And the "lineNumber" of stack frame 0 equals 12

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: using intercept to notify a promise rejection
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "handled"
  And I run the service "handled" with the command "node scenarios/intercept-rejection"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the event "severityReason.type" equals "callbackErrorIntercept"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "ENOENT: no such file or directory, open 'does not exist'"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/intercept-rejection.js"
  And the "lineNumber" of stack frame 0 equals 21

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |
