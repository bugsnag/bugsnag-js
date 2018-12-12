Feature: Setting project root

Background:
  Given I set environment variable "BUGSNAG_API_KEY" to "9c2151b65d615a3a95ba408142c8698f"
  And I configure the bugsnag notify endpoint
  And I have built the service "project_root"

Scenario: project root should default to the current working directory
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

Scenario: the project root can be configured
  And I run the service "project_root" with the command "node scenarios/appdir/project-root-custom"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the "file" of stack frame 0 equals "project-root-custom.js"
  And the "inProject" of stack frame 0 is true
  And the "file" of stack frame 1 equals "/app/node_modules/lodash/lodash.js"
  And the "inProject" of stack frame 1 is false
  And the "file" of stack frame 5 equals "/app/out.js"
  And the "inProject" of stack frame 5 is false

Scenario: the project root can be switched off
  And I run the service "project_root" with the command "node scenarios/project-root-null"
  And I wait for 1 second
  Then I should receive 1 request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the "file" of stack frame 0 equals "/app/scenarios/project-root-null.js"
  And the "inProject" of stack frame 0 is null
  And the "file" of stack frame 1 equals "/app/node_modules/lodash/lodash.js"
  And the "inProject" of stack frame 1 is null