Feature: Sessions

Scenario: Automatic session on app start
  When I run "SessionAutoEnabledScenario"
  Then I wait to receive a request
  And the "bugsnag-api-key" header equals "12312312312312312312312312312312"
  And the "bugsnag-payload-version" header equals "1.0"
  And the "Content-Type" header equals "application/json"
  And the "Bugsnag-Sent-At" header is a timestamp
  And the payload field "notifier.name" equals the platform-dependent string:
  | android | Bugsnag React Native |
  | ios     | iOS Bugsnag Notifier |
  And the payload field "notifier.url" equals the platform-dependent string:
  | android | https://github.com/bugsnag/bugsnag-js    |
  | ios     | https://github.com/bugsnag/bugsnag-cocoa |
  And the payload field "notifier.version" is not null
  And the payload field "app" is not null
  And the payload field "device" is not null
  And the payload has a valid sessions array

Scenario: Automatic sessions disabled
  When I run "SessionAutoDisabledScenario"
  And I wait for 5 seconds
  Then I should receive no requests

Scenario: Manual JS sessions (JS Controls)
  When I run "SessionJsControlledManualJsScenario"
  Then I wait to receive 6 requests
  And the "bugsnag-api-key" header equals "12312312312312312312312312312312"
  And the "bugsnag-payload-version" header equals "1.0"
  And the "Content-Type" header equals "application/json"
  And the "Bugsnag-Sent-At" header is a timestamp
  And the payload field "notifier.name" equals "Bugsnag React Native"
  And the payload field "notifier.url" equals "https://github.com/bugsnag/bugsnag-js"
  And the payload field "notifier.version" is not null
  And the payload field "app" is not null
  And the payload field "device" is not null
  And the payload has a valid sessions array
  And the payload field "sessions.0.id" is stored as the value "initial_session_id"

  And I discard the oldest request

  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioA"
  And the event "unhandled" is false
  And the event "session" is not null
  And the payload field "events.0.session.id" equals the stored value "initial_session_id"
  And the event "session.events.handled" equals 1

  And I discard the oldest request

  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioB"
  And the event "unhandled" is false
  And the event "session" is null

  And I discard the oldest request

  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioC"
  And the event "unhandled" is false
  And the event "session" is not null
  And the payload field "events.0.session.id" equals the stored value "initial_session_id"
  And the event "session.events.handled" equals 2

  And I discard the oldest request

  And the payload has a valid sessions array
  And the payload field "sessions.0.id" does not equal the stored value "initial_session_id"
  And the payload field "sessions.0.id" is stored as the value "second_session_id"

  And I discard the oldest request

  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioD"
  And the event "unhandled" is false
  And the event "session" is not null
  And the payload field "events.0.session.id" equals the stored value "second_session_id"
  And the event "session.events.handled" equals 1

Scenario: Manual JS sessions (Native Controls)
  When I run "SessionNativeControlledManualJsScenario"
  And I wait for 10 seconds
  Then I wait to receive 6 requests
  And the "bugsnag-api-key" header equals "12312312312312312312312312312312"
  And the "bugsnag-payload-version" header equals "1.0"
  And the "Content-Type" header equals "application/json"
  And the "Bugsnag-Sent-At" header is a timestamp
  And the payload field "notifier.name" equals "Bugsnag React Native"
  And the payload field "notifier.url" equals "https://github.com/bugsnag/bugsnag-js"
  And the payload field "notifier.version" is not null
  And the payload field "app" is not null
  And the payload field "device" is not null
  And the payload has a valid sessions array
  And the payload field "sessions.0.id" is stored as the value "initial_session_id"

  And I discard the oldest request

  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioA"
  And the event "unhandled" is false
  And the event "session" is not null
  And the payload field "events.0.session.id" equals the stored value "initial_session_id"
  And the event "session.events.handled" equals 1

  And I discard the oldest request

  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioB"
  And the event "unhandled" is false
  And the event "session" is null

  And I discard the oldest request

  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioC"
  And the event "unhandled" is false
  And the event "session" is not null
  And the payload field "events.0.session.id" equals the stored value "initial_session_id"
  And the event "session.events.handled" equals 2

  And I discard the oldest request

  And the payload has a valid sessions array
  And the payload field "sessions.0.id" does not equal the stored value "initial_session_id"
  And the payload field "sessions.0.id" is stored as the value "second_session_id"

  And I discard the oldest request

  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioD"
  And the event "unhandled" is false
  And the event "session" is not null
  And the payload field "events.0.session.id" equals the stored value "second_session_id"
  And the event "session.events.handled" equals 1

Scenario: Manual Native sessions (JS Controls)
  When I run "SessionJsControlledManualNativeScenario"
  Then I wait to receive 6 requests
  And the "bugsnag-api-key" header equals "12312312312312312312312312312312"
  And the "bugsnag-payload-version" header equals "1.0"
  And the "Content-Type" header equals "application/json"
  And the "Bugsnag-Sent-At" header is a timestamp
  And the payload field "notifier.name" equals "Bugsnag React Native"
  And the payload field "notifier.url" equals "https://github.com/bugsnag/bugsnag-js"
  And the payload field "notifier.version" is not null
  And the payload field "app" is not null
  And the payload field "device" is not null
  And the payload has a valid sessions array
  And the payload field "sessions.0.id" is stored as the value "initial_session_id"

  And I discard the oldest request

  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "HandledNativeErrorScenario"
  And the event "unhandled" is false
  And the event "session" is not null
  And the payload field "events.0.session.id" equals the stored value "initial_session_id"
  And the event "session.events.handled" equals 1

  And I discard the oldest request

  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "HandledNativeErrorScenario"
  And the event "unhandled" is false
  And the event "session" is null

  And I discard the oldest request

  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "HandledNativeErrorScenario"
  And the event "unhandled" is false
  And the event "session" is not null
  And the payload field "events.0.session.id" equals the stored value "initial_session_id"
  And the event "session.events.handled" equals 2

  And I discard the oldest request

  And the payload has a valid sessions array
  And the payload field "sessions.0.id" does not equal the stored value "initial_session_id"
  And the payload field "sessions.0.id" is stored as the value "second_session_id"

  And I discard the oldest request

  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "HandledNativeErrorScenario"
  And the event "unhandled" is false
  And the event "session" is not null
  And the payload field "events.0.session.id" equals the stored value "second_session_id"
  And the event "session.events.handled" equals 1
