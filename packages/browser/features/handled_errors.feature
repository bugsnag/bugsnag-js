@handled
Feature: Reporting handled errors

Scenario Outline: calling notify() with Error
  When I navigate to the URL "/handled/<type>/a.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "bad things"
  And the exception "type" equals "browserjs"

  Examples:
    | type       |
    | script     |
    | webpack3   |
    | webpack4   |
    | browserify |
    | rollup     |
    | typescript |

Scenario Outline: calling notify() with Error within try/catch
  When I navigate to the URL "/handled/<type>/b.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "handled" values for the current browser
  And the exception "type" equals "browserjs"

  Examples:
    | type       |
    | script     |
    | webpack3   |
    | webpack4   |
    | browserify |
    | rollup     |
    | typescript |

Scenario Outline: calling notify() with Error within Promise catch
  When I navigate to the URL "/handled/<type>/c.html"
  And the test should run in this browser
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "bad things"
  And the exception "type" equals "browserjs"

  Examples:
    | type       |
    | script     |
    | webpack3   |
    | webpack4   |
    | browserify |
    | rollup     |
    | typescript |
