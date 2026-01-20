Feature: @bugsnag/plugin-cloudflare-workers

Scenario: A handled error
  When I start the worker "cloudflare-worker"
  And I wait for the host "localhost" to open port "8787"
  Then I open the URL "http://localhost:8787/handled?a=1&b=2" and get a 200 response with body "Hello World!"

  Then I wait to receive a session
  And the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier

  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 matches "index.js"
  And the event "request.url" equals "http://localhost:8787/handled?a=1&b=2"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
  And the event "request.headers" is not null
  And the event "metaData.request.path" equals "/handled"
  And the event "metaData.request.query.a" equals "1"
  And the event "metaData.request.query.b" equals "2"

Scenario: An unhandled error
  When I start the worker "cloudflare-worker"
  And I wait for the host "localhost" to open port "8787"
  Then I open the URL "http://localhost:8787/unhandled?a=1&b=2" and get a 500 response

  Then I wait to receive a session
  And the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier

  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "unhandled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 matches "index.js"
  And the event "request.url" equals "http://localhost:8787/unhandled?a=1&b=2"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
  And the event "request.headers" is not null
  And the event "metaData.request.path" equals "/unhandled"
  And the event "metaData.request.query.a" equals "1"
  And the event "metaData.request.query.b" equals "2"

Scenario: Metadata from one request do not appear in another
  When I start the worker "cloudflare-worker"
  And I wait for the host "localhost" to open port "8787"
  Then I open the URL "http://localhost:8787/metadata_a" and get a 200 response with body "Hello World!"

  Then I wait to receive a session
  And the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier

  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "Metadata A Error"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 matches "index.js"
  And the event "request.url" equals "http://localhost:8787/metadata_a"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
  And the event "request.headers" is not null
  And the event "metaData.request.path" equals "/metadata_a"
  And the event "metaData.Metadata A" is not null
  And the event "metaData.Metadata B" is null

  And I discard the oldest session
  And I discard the oldest error

  And I open the URL "http://localhost:8787/metadata_b" and get a 200 response with body "Hello World!"

  And I wait to receive a session
  And the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier

  And I wait to receive an error
  And the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "Metadata B Error"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 matches "index.js"
  And the event "request.url" equals "http://localhost:8787/metadata_b"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
  And the event "request.headers" is not null
  And the event "metaData.request.path" equals "/metadata_b"
  And the event "metaData.Metadata A" is null
  And the event "metaData.Metadata B" is not null

Scenario: Breadcrumbs from one request do not appear in another
  When I start the worker "cloudflare-worker"
  And I wait for the host "localhost" to open port "8787"
  Then I open the URL "http://localhost:8787/breadcrumbs_a" and get a 200 response with body "Hello World!"

  Then I wait to receive a session
  And the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier

  Then I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the exception "message" equals "Breadcrumb A Error"
  And the event "request.url" equals "http://localhost:8787/breadcrumbs_a"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
  And the event has a "manual" breadcrumb named "Breadcrumb A"

  And I discard the oldest session
  And I discard the oldest error

  And I open the URL "http://localhost:8787/breadcrumbs_b" and get a 200 response with body "Hello World!"

  And I wait to receive a session
  And the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier

  And I wait to receive an error
  And the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the exception "message" equals "Breadcrumb B Error"
  And the event "request.url" equals "http://localhost:8787/breadcrumbs_b"
  And the event "request.httpMethod" equals "GET"
  And the event "request.clientIp" is not null
  And the event has a "manual" breadcrumb named "Breadcrumb B"
  And the event does not have a "manual" breadcrumb with message "Breadcrumb A"