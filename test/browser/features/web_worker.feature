# browsers that do not support web workers
@skip_ie_8 @skip_ie_9

# browsers that currently throw errors in our test fixtures 
@skip_ie_10 @skip_ie_11 @skip_chrome_43 @skip_edge_17 @skip_safari_10 @skip_before_ios_12

Feature: worker notifier

  Scenario: notifying from within a worker
    When I navigate to the test URL "/web_worker/worker_notify_error"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "errorMessage" equals "I am an error"
    And I should receive no sessions

  Scenario: config.autoDetectErrors defaults to false
    Given I navigate to the test URL "/web_worker/worker_auto_detect_errors/default"
    Then I should receive no errors
 
  Scenario: setting config.autoDetectErrors option to true
    Given I navigate to the test URL "/web_worker/worker_auto_detect_errors/enabled"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array
    And I should receive no sessions

  Scenario: setting collectUserIp option to false
    When I navigate to the test URL "/web_worker/ip_redaction"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    And the event "request.clientIp" equals "[REDACTED]"
    And the event "user.id" equals "[REDACTED]"
    And I should receive no sessions

  Scenario: unhandled promise rejection
    When I navigate to the test URL "/web_worker/worker_unhandled_promise_rejection"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "broken promises"
    And event 0 is unhandled
    And I should receive no sessions

  Scenario: setting autoTrackSessions option to true
    When I navigate to the test URL "/web_worker/auto_track_sessions"
    And I wait to receive a session
    Then the session is a valid browser payload for the session tracking API
