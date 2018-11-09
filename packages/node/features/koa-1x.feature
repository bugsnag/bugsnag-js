Feature: @bugsnag/plugin-koa (koa v1.x support)

Background:
  Given I set environment variable "BUGSNAG_API_KEY" to "9c2151b65d615a3a95ba408142c8698f"
  And I configure the bugsnag notify endpoint

Scenario Outline: a synchronous thrown error in a route
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "koa-1x"
  And I start the service "koa-1x"
  And I wait for the app to respond on port "4320"
  Then I open the URL "http://localhost:4320/err"
  And I wait for 2 seconds
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "noooop"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.url" equals "http://localhost:4320/err"
  And the event "request.httpMethod" equals "GET"

  Examples:
  | node version |
  | 8            |

Scenario Outline: An error created with with ctx.throw()
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "koa-1x"
  And I start the service "koa-1x"
  And I wait for the app to respond on port "4320"
  Then I open the URL "http://localhost:4320/ctx-throw"
  And I wait for 2 seconds
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "InternalServerError"
  And the exception "message" equals "thrown"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "node_modules/koa/lib/context.js"
  And the "file" of stack frame 1 equals "scenarios/app.js"

  Examples:
  | node version |
  | 8            |

Scenario Outline: an error thrown before the requestHandler middleware
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "koa-1x"
  And I start the service "koa-1x"
  And I wait for the app to respond on port "4320"
  Then I open the URL "http://localhost:4320/error-before-handler"
  And I wait for 2 seconds
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledErrorMiddleware"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "nope"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"

  Examples:
  | node version |
  | 8            |

Scenario Outline: throwing non-Error error
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "koa-1x"
  And I start the service "koa-1x"
  And I wait for the app to respond on port "4320"
  Then I open the URL "http://localhost:4320/throw-non-error"
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
  And the "file" of stack frame 0 equals "node_modules/@bugsnag/plugin-koa/dist/bugsnag-koa.js"

  Examples:
  | node version |
  | 8            |
