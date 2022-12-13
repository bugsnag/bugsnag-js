@skip_ie_8 @skip_ie_9 @skip_ie_10 @skip_ie_11 @skip_chrome_43 @skip_chrome_72 @skip_edge_17 @skip_firefox_78 @skip_firefox_107 @skip_safari_10 @skip_iphone_7

Feature: worker notifier

Scenario: notifying from within a worker
  When I navigate to the test URL "/web_worker/worker_notify_error"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "errorMessage" equals "I am an error"

Scenario: unhandled error in worker
  When I navigate to the test URL "/web_worker/worker_unhandled_error"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "errorMessage" equals "I am an error"
