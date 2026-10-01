@browserlite
Feature: @bugsnag/browserlite loads a minimal plugin set by default

  Scenario: calling notify() with Error
    When I navigate to the test URL "/browserlite/notify_new_error.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "bad things"
    And the exception "type" equals "browserjs"
    And the error payload field "events.0.app.type" equals "browser"
    And event 0 is handled

  Scenario: uncaught thrown errors are captured by the bundled window.onerror plugin
    When I navigate to the test URL "/browserlite/thrown.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "bad things"
    And event 0 is unhandled

  @requires_promise
  @requires_unhandled_rejection
  Scenario: unhandled promise rejections are captured by the bundled plugin
    When I navigate to the test URL "/browserlite/promise_rejection.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "broken promises"
    And event 0 is unhandled

  Scenario: sessions are not tracked automatically, unlike @bugsnag/browser
    When I navigate to the test URL "/browserlite/session_not_tracked.html"
    Then I should receive no sessions

  Scenario: extra breadcrumb plugins can be opted into via the plugins config option
    When I navigate to the test URL "/browserlite/breadcrumb_plugin_opt_in.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the event "breadcrumbs.0.name" equals "manual breadcrumb"
