Feature: Inline script detection

  Scenario: loading Bugsnag before scripts have run
    When I navigate to the test URL "/inline_script/script/a.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "hi"
    And the exception "type" equals "browserjs"
    And event 0 is handled
    And the event "metaData.script" is not null

  Scenario: loading Bugsnag after scripts have run
    When I navigate to the test URL "/inline_script/script/b.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "async hi"
    And the exception "type" equals "browserjs"
    And event 0 is handled
    And the event "metaData.script" is null

  Scenario: inline script detected after location change
    When I navigate to the test URL "/navigation/script/a.html"
    And the test should run in this browser
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the event "metaData.script.content" matches "throw new Error\('history'\)"
