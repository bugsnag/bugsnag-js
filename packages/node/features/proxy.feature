Feature: Proxy support

Background:
  Given I set environment variable "BUGSNAG_API_KEY" to "9c2151b65d615a3a95ba408142c8698f"
  And I configure the bugsnag notify endpoint

# Scenario Outline: using environment variables to configure a proxy
#   And I set environment variable "NODE_VERSION" to "<node version>"
#   And I set environment variable "HTTP_PROXY" to "http://corporate-proxy:3128"
#   And I have built the service "proxy"
#   And I run the service "proxy" with the command "node scenarios/environment-proxy"
#   And I wait for 1 second
#   Then I should receive a request
#   And the request used the Node notifier
#   And the request used payload v4 headers
#   And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
#   And the event "unhandled" is false
#   And the event "severity" equals "warning"
#   And the event "severityReason.type" equals "handledException"
#   And the exception "errorClass" equals "Error"
#   And the exception "message" equals "hi via proxy"
#
#   Examples:
#   | node version |
#   | 4            |
#   | 6            |
#   | 8            |
#
# Scenario Outline: making sure no request get through a bad proxy
#   And I set environment variable "NODE_VERSION" to "<node version>"
#   And I set environment variable "HTTP_PROXY" to "http://not-a-proxy:3128"
#   And I have built the service "proxy"
#   And I run the service "proxy" with the command "node scenarios/environment-proxy"
#   And I wait for 1 second
#   Then I should receive 0 requests
#
#   Examples:
#   | node version |
#   | 4            |
#   | 6            |
#   | 8            |

# Scenario Outline: using options to configure a proxy
#   And I set environment variable "NODE_VERSION" to "<node version>"
#   And I have built the service "proxy"
#   And I run the service "proxy" with the command "node scenarios/config-proxy"
#   And I wait for 1 second
#   Then I should receive a request
#   And the request used the Node notifier
#   And the request used payload v4 headers
#   And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
#   And the event "unhandled" is false
#   And the event "severity" equals "warning"
#   And the event "severityReason.type" equals "handledException"
#   And the exception "errorClass" equals "Error"
#   And the exception "message" equals "hi via proxy"
#
#   Examples:
#   | node version |
#   | 4            |
#   | 6            |
#   | 8            |
#
# Scenario Outline: making sure no request get through a misconfigured proxy
#   And I set environment variable "NODE_VERSION" to "<node version>"
#   And I have built the service "proxy"
#   And I run the service "proxy" with the command "node scenarios/config-misconfigured-proxy"
#   And I wait for 1 second
#   Then I should receive 0 requests
#
#   Examples:
#   | node version |
#   | 4            |
#   | 6            |
#   | 8            |
