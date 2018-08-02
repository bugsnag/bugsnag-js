Feature: Setting project root

Background:
  Given I set environment variable "BUGSNAG_API_KEY" to "9c2151b65d615a3a95ba408142c8698f"
  And I configure the bugsnag endpoint

Scenario Outline: project root should default to the current working directory
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "project_root"
  And I run the service "project_root" with the command "node scenarios/project-root-default"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the "file" of stack frame 0 equals "scenarios/project-root-default.js"

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: the project root can be configured
And I set environment variable "NODE_VERSION" to "<node version>"
And I have built the service "project_root"
And I run the service "project_root" with the command "node scenarios/appdir/project-root-custom"
And I wait for 1 second
Then I should receive a request
And the request used the Node notifier
And the request used payload v4 headers
And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
And the "file" of stack frame 0 equals "project-root-custom.js"

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

# Scenario Outline: the project root can be switched off
#   And I set environment variable "NODE_VERSION" to "<node version>"
#   And I have built the service "project_root"
#   And I run the service "project_root" with the command "node scenarios/send-code-off"
#   And I wait for 1 second
#   Then I should receive 1 request
#   And the request used the Node notifier
#   And the request used payload v4 headers
#   And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
#   And the payload field "events.0.exceptions.0.stacktrace.0.code" is null
#
#   Examples:
#   | node version |
#   | 4            |
#   | 6            |
#   | 8            |
