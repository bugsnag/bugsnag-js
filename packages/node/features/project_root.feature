Feature: Setting project root

Background:
  Given I set environment variable "BUGSNAG_API_KEY" to "9c2151b65d615a3a95ba408142c8698f"
  And I configure the bugsnag notify endpoint

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
  And the "inProject" of stack frame 0 is true
  And the "file" of stack frame 1 equals "node_modules/lodash/lodash.js"
  And the "inProject" of stack frame 1 is false

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
And the "inProject" of stack frame 0 is true
And the "file" of stack frame 1 equals "/usr/src/app/node_modules/lodash/lodash.js"
And the "inProject" of stack frame 1 is false
And the "file" of stack frame 5 equals "/usr/src/app/out.js"
And the "inProject" of stack frame 5 is false


  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: the project root can be switched off
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "project_root"
  And I run the service "project_root" with the command "node scenarios/project-root-null"
  And I wait for 1 second
  Then I should receive 1 request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the "file" of stack frame 0 equals "/usr/src/app/scenarios/project-root-null.js"
  And the "inProject" of stack frame 0 is null
  And the "file" of stack frame 1 equals "/usr/src/app/node_modules/lodash/lodash.js"
  And the "inProject" of stack frame 1 is null

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |
