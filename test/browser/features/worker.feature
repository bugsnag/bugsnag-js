Feature: worker notifier

Scenario: notifying from within a worker
  When I navigate to the test URL "/worker/worker_notify_error"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
