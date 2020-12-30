@handled
Feature: Reporting handled errors

Scenario Outline: calling notify() with Error
  When I navigate to the test URL "/handled/<type>/a.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "bad things"
  And the exception "type" equals "browserjs"
  And event 0 is handled

  Examples:
    | type       |
    | script     |
    | webpack3   |
    | webpack4   |
    | browserify |
    | rollup     |
    | typescript |

Scenario Outline: calling notify() with Error within try/catch
  When I navigate to the test URL "/handled/<type>/b.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "handled" values for the current browser
  And the exception "type" equals "browserjs"
  And event 0 is handled

  Examples:
    | type       |
    | script     |
    | webpack3   |
    | webpack4   |
    | browserify |
    | rollup     |
    | typescript |

Scenario Outline: calling notify() with Error within Promise catch
  When I navigate to the test URL "/handled/<type>/c.html"
  And the test should run in this browser
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "bad things"
  And the exception "type" equals "browserjs"
  And event 0 is handled

  Examples:
    | type       |
    | script     |
    | webpack3   |
    | webpack4   |
    | browserify |
    | rollup     |
    | typescript |

Scenario: calling notify() with an object, getting a generated a stacktrace
  When I navigate to the test URL "/handled/script/d.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Errr"
  And the exception "message" equals "make a stacktrace for me"
  And the exception "type" equals "browserjs"

  # this ensures the first generated stackframe doesn't come from bugsnag's source
  And the payload field "events.0.exceptions.0.stacktrace.0.method" equals "a"
  And event 0 is handled

Scenario: calling notify() with a string, getting a generated stacktrace
  When I navigate to the test URL "/handled/script/e.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "make a stacktrace for me"
  And the exception "type" equals "browserjs"

  # this ensures the first generated stackframe doesn't come from bugsnag's source
  And the payload field "events.0.exceptions.0.stacktrace.0.method" equals "a"
  And event 0 is handled

Scenario: calling window.client.notify() with an object, getting a generated stacktrace
  When I navigate to the test URL "/handled/script/f.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "make a stacktrace for me"
  And the exception "type" equals "browserjs"

  # this ensure the stacktrace features all of the nested stackframes
  And the payload field "events.0.exceptions.0.stacktrace.0.method" equals "a"
  And the payload field "events.0.exceptions.0.stacktrace.1.method" equals "b"
  And the payload field "events.0.exceptions.0.stacktrace.2.method" equals "c"
  And event 0 is handled

Scenario: calling window.client.notify() with a string, getting a generated stacktrace
  When I navigate to the test URL "/handled/script/g.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "make a stacktrace for me"
  And the exception "type" equals "browserjs"

  # this ensure the stacktrace features all of the nested stackframes
  And the payload field "events.0.exceptions.0.stacktrace.0.method" equals "a"
  And the payload field "events.0.exceptions.0.stacktrace.1.method" equals "b"
  And the payload field "events.0.exceptions.0.stacktrace.2.method" equals "c"
  And event 0 is handled

Scenario: overridden handled state in a callback
  When I navigate to the test URL "/handled/script/h.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception "message" ends with "hello"
  # The severity is "error" because only the handled-ness has been changed
  And event 0 is handled with the severity "error"
