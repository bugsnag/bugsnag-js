Feature: @bugsnag/plugin-restify

Background:
  Given I set environment variable "BUGSNAG_API_KEY" to "9c2151b65d615a3a95ba408142c8698f"
  And I configure the bugsnag notify endpoint

Scenario Outline: a synchronous thrown error in a route
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "restify"
  And I start the service "restify"
  And I wait for the app to respond on port "4314"
  Then I open the URL "http://localhost:4314/sync"
  And I wait for 2 seconds
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "sync"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://localhost:4314/sync"
  And the event "request.httpMethod" equals "GET"

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: an asynchronous thrown error in a route
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "restify"
  And I start the service "restify"
  And I wait for the app to respond on port "4314"
  Then I open the URL "http://localhost:4314/async"
  And I wait for 2 seconds
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "async"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: an error passed to next(err)
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "restify"
  And I start the service "restify"
  And I wait for the app to respond on port "4314"
  Then I open the URL "http://localhost:4314/next"
  And I wait for 2 seconds
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "next"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: throwing non-Error error
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "restify"
  And I start the service "restify"
  And I wait for the app to respond on port "4314"
  Then I open the URL "http://localhost:4314/throw-non-error"
  And I wait for 2 seconds
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" matches "^Handled a non-error\."
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "node_modules/@bugsnag/plugin-restify/dist/bugsnag-restify.js"

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: an explicit 404
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "restify"
  And I start the service "restify"
  And I wait for the app to respond on port "4314"
  Then I open the URL "http://localhost:4314/not-found"
  And I wait for 2 seconds
  Then I should receive 0 requests

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: an explicit internal server error
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "restify"
  And I start the service "restify"
  And I wait for the app to respond on port "4314"
  Then I open the URL "http://localhost:4314/internal"
  And I wait for 2 seconds
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "InternalServerError"
  And the exception "message" equals "oh noes!"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |
