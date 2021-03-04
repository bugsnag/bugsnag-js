Feature: Setting project root

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: project root should default to the current working directory
  And I run the service "project_root" with the command "node scenarios/project-root-default"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the "file" of stack frame 0 equals "scenarios/project-root-default.js"
  And the "inProject" of stack frame 0 is true
  And the "file" of stack frame 1 equals "node_modules/lodash/lodash.js"
  And the "inProject" of stack frame 1 is false

Scenario: the project root can be configured
  And I run the service "project_root" with the command "node scenarios/appdir/project-root-custom"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the "file" of stack frame 0 equals "project-root-custom.js"
  And the "inProject" of stack frame 0 is true
  And the "file" of stack frame 1 equals "/app/node_modules/lodash/lodash.js"
  And the "inProject" of stack frame 1 is false
  And the "file" of stack frame 5 equals "/app/out.js"
  And the "inProject" of stack frame 5 is false

Scenario: the project root can be switched off
  And I run the service "project_root" with the command "node scenarios/project-root-null"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the "file" of stack frame 0 equals "/app/scenarios/project-root-null.js"
  And the "inProject" of stack frame 0 is null
  And the "file" of stack frame 1 equals "/app/node_modules/lodash/lodash.js"
  And the "inProject" of stack frame 1 is null