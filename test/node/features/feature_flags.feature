Feature: feature flags

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: adding feature flags for an unhandled error
  Given I start the service "express"
  And I wait for the host "express" to open port "80"
  When I POST the data "a=1&b=2&c=3&d=4" to the URL "http://express/features/unhandled"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "oh no"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.httpMethod" equals "POST"
  And the event contains the following feature flags:
     | featureFlag   | variant |
     | from config 1 | 1234    |
     | from config 2 |         |
     | a             | 1       |
     | b             | 2       |
     | c             | 3       |
     | d             | 4       |
  # ensure each request can have its own set of feature flags
  When I discard the oldest error
  And I POST the data "x=9&y=8&z=7" to the URL "http://express/features/unhandled"
  And I wait to receive an error
  And the event contains the following feature flags:
     | featureFlag   | variant |
     | from config 1 | 1234    |
     | from config 2 |         |
     | x             | 9       |
     | y             | 8       |
     | z             | 7       |

Scenario: adding feature flags for a handled error
  Given I start the service "express"
  And I wait for the host "express" to open port "80"
  When I POST the data "a=1&b=2&c=3&d=4" to the URL "http://express/features/handled"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "oh no"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.httpMethod" equals "POST"
  And the event contains the following feature flags:
     | featureFlag   | variant |
     | from config 1 | 1234    |
     | from config 2 |         |
     | a             | 1       |
     | b             | 2       |
     | c             | 3       |
     | d             | 4       |
  # ensure each request can have its own set of feature flags
  When I discard the oldest error
  And I POST the data "x=9&y=8&z=7" to the URL "http://express/features/handled"
  And I wait to receive an error
  And the event contains the following feature flags:
     | featureFlag   | variant |
     | from config 1 | 1234    |
     | from config 2 |         |
     | x             | 9       |
     | y             | 8       |
     | z             | 7       |

Scenario: clearing all feature flags doesn't affect subsequent requests
  Given I start the service "express"
  And I wait for the host "express" to open port "80"
  When I POST the data "a=1&b=2&c=3&d=4&clearAllFeatureFlags" to the URL "http://express/features/unhandled"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "oh no"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/app.js"
  And the event "request.httpMethod" equals "POST"
  And the event has no feature flags
  When I discard the oldest error
  And I POST the data "x=9&y=8&z=7" to the URL "http://express/features/unhandled"
  And I wait to receive an error
  And the event contains the following feature flags:
     | featureFlag   | variant |
     | from config 1 | 1234    |
     | from config 2 |         |
     | x             | 9       |
     | y             | 8       |
     | z             | 7       |
