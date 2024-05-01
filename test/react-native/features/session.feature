Feature: Sessions

Scenario: Automatic session on app start
  When I run "SessionAutoEnabledScenario"
  Then I wait to receive a session
  And the session "bugsnag-api-key" header equals "12312312312312312312312312312312"
  And the session "bugsnag-payload-version" header equals "1.0"
  And the session "Content-Type" header equals "application/json"
  And the session "Bugsnag-Sent-At" header is a timestamp
  And the session payload field "notifier.name" equals the platform-dependent string:
  | android | Android Bugsnag Notifier |
  | ios     | iOS Bugsnag Notifier     |
  And the session payload field "notifier.url" equals the platform-dependent string:
  | android | https://bugsnag.com                      |
  | ios     | https://github.com/bugsnag/bugsnag-cocoa |
  And the session payload field "notifier.version" is not null
  And the session payload field "app" is not null
  And the session payload field "device" is not null
  And the session payload has a valid sessions array

Scenario: Automatic sessions disabled
  When I run "SessionAutoDisabledScenario"
  And I wait for 5 seconds
  Then I should receive no sessions

Scenario: Manual JS sessions (JS Controls)
  When I run "SessionJsControlledManualJsScenario"
  Then I wait to receive 2 sessions
  And I wait to receive 4 errors

  # Initial session
  Then the session "bugsnag-api-key" header equals "12312312312312312312312312312312"
  And the session "bugsnag-payload-version" header equals "1.0"
  And the session "Content-Type" header equals "application/json"
  And the session "Bugsnag-Sent-At" header is a timestamp
  And the session payload field "notifier.name" equals "Bugsnag React Native"
  And the session payload field "notifier.url" equals "https://github.com/bugsnag/bugsnag-js"
  And the session payload field "notifier.version" is not null
  And the session payload field "app" is not null
  And the session payload field "device" is not null
  And the session payload has a valid sessions array
  And the session payload field "sessions.0.id" is stored as the value "initial_session_id"

  And I discard the oldest session

  # Error triggered after the first session is started
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioA"
  And the event "unhandled" is false
  And the event "session" is not null
  And the error payload field "events.0.session.id" equals the stored value "initial_session_id"
  And the event "session.events.handled" equals 1

  And I discard the oldest error

  # Error triggered after the first session is paused
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioB"
  And the event "unhandled" is false
  And the event "session" is null

  And I discard the oldest error

  # Error triggered after the first session is resumed
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioC"
  And the event "unhandled" is false
  And the event "session" is not null
  And the error payload field "events.0.session.id" equals the stored value "initial_session_id"
  And the event "session.events.handled" equals 2

  And I discard the oldest error

  # Second session
  And the session payload has a valid sessions array
  And the session payload field "sessions.0.id" does not equal the stored value "initial_session_id"
  And the session payload field "sessions.0.id" is stored as the value "second_session_id"

  # Error triggered after the second session is started
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioD"
  And the event "unhandled" is false
  And the event "session" is not null
  And the error payload field "events.0.session.id" equals the stored value "second_session_id"
  And the event "session.events.handled" equals 1

Scenario: Manual JS sessions (Native Controls)
  When I run "SessionNativeControlledManualJsScenario"
  And I wait for 10 seconds
  Then I wait to receive 2 sessions
  And I wait to receive 4 errors

  # Initial session
  And the session "bugsnag-api-key" header equals "12312312312312312312312312312312"
  And the session "bugsnag-payload-version" header equals "1.0"
  And the session "Content-Type" header equals "application/json"
  And the session "Bugsnag-Sent-At" header is a timestamp
  And the session payload field "notifier.name" equals "Bugsnag React Native"
  And the session payload field "notifier.url" equals "https://github.com/bugsnag/bugsnag-js"
  And the session payload field "notifier.version" is not null
  And the session payload field "app" is not null
  And the session payload field "device" is not null
  And the session payload has a valid sessions array
  And the session payload field "sessions.0.id" is stored as the value "initial_session_id"

  And I discard the oldest session

  # Error triggered after the first session is started
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioA"
  And the event "unhandled" is false
  And the event "session" is not null
  And the error payload field "events.0.session.id" equals the stored value "initial_session_id"
  And the event "session.events.handled" equals 1

  And I discard the oldest error

  # Error triggered after the first session is paused
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioB"
  And the event "unhandled" is false
  And the event "session" is null

  And I discard the oldest error

  # Error triggered after the first session is resumed
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioC"
  And the event "unhandled" is false
  And the event "session" is not null
  And the error payload field "events.0.session.id" equals the stored value "initial_session_id"
  And the event "session.events.handled" equals 2

  And I discard the oldest error

  # Second session
  And the session payload has a valid sessions array
  And the session payload field "sessions.0.id" does not equal the stored value "initial_session_id"
  And the session payload field "sessions.0.id" is stored as the value "second_session_id"

  # Error triggered after the second session is started
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionJsControlledManualJsScenarioD"
  And the event "unhandled" is false
  And the event "session" is not null
  And the error payload field "events.0.session.id" equals the stored value "second_session_id"
  And the event "session.events.handled" equals 1

Scenario: Manual Native sessions (JS Controls)
  When I run "SessionJsControlledManualNativeScenario"
  Then I wait to receive 2 sessions
  And I wait to receive 4 errors

  # Initial session
  And the session "bugsnag-api-key" header equals "12312312312312312312312312312312"
  And the session "bugsnag-payload-version" header equals "1.0"
  And the session "Content-Type" header equals "application/json"
  And the session "Bugsnag-Sent-At" header is a timestamp
  And the session payload field "notifier.name" equals "Bugsnag React Native"
  And the session payload field "notifier.url" equals "https://github.com/bugsnag/bugsnag-js"
  And the session payload field "notifier.version" is not null
  And the session payload field "app" is not null
  And the session payload field "device" is not null
  And the session payload has a valid sessions array
  And the session payload field "sessions.0.id" is stored as the value "initial_session_id"

  And I discard the oldest session

  # Error triggered after the first session is started
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "HandledNativeErrorScenario"
  And the event "unhandled" is false
  And the event "session" is not null
  And the error payload field "events.0.session.id" equals the stored value "initial_session_id"
  And the event "session.events.handled" equals 1

  And I discard the oldest error

  # Error triggered after the first session is paused
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "HandledNativeErrorScenario"
  And the event "unhandled" is false
  And the event "session" is null

  And I discard the oldest error

  # Error triggered after the first session is resumed
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "HandledNativeErrorScenario"
  And the event "unhandled" is false
  And the event "session" is not null
  And the error payload field "events.0.session.id" equals the stored value "initial_session_id"
  And the event "session.events.handled" equals 2

  And I discard the oldest error

  # Second session
  And the session payload has a valid sessions array
  And the session payload field "sessions.0.id" does not equal the stored value "initial_session_id"
  And the session payload field "sessions.0.id" is stored as the value "second_session_id"

  # Error triggered after the second session is started
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "HandledNativeErrorScenario"
  And the event "unhandled" is false
  And the event "session" is not null
  And the error payload field "events.0.session.id" equals the stored value "second_session_id"
  And the event "session.events.handled" equals 1
