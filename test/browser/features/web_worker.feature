@skip_ie_8 @skip_ie_9 @skip_ie_10 @skip_ie_11 @skip_chrome_43 @skip_chrome_72 @skip_edge_17 @skip_firefox_78 @skip_firefox_107 @skip_safari_10 @skip_iphone_7

Feature: worker notifier

Scenario: notifying from within a worker
  When I navigate to the test URL "/web_worker/worker_notify_error"
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "errorMessage" equals "I am an error"

Scenario: unhandled error in worker
  When I navigate to the test URL "/web_worker/worker_unhandled_error"
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array

Scenario: setting collectUserIp option to false
  When I navigate to the test URL "/web_worker/ip_redaction"
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API
  And the event "request.clientIp" equals "[REDACTED]"
  And the event "user.id" equals "[REDACTED]"

Scenario: unhandled promise rejection
  When I navigate to the test URL "/web_worker/unhandled_promise_rejection"
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "broken promises"
  And event 0 is unhandled

Scenario: setting autoTrackSessions option to true
  When I navigate to the test URL "/web_worker/auto_track_sessions"
  And I wait to receive a session
  Then the session is a valid browser payload for the session tracking API
  