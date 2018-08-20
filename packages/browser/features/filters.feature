@filters
Feature: Filtering sensitive content from payload

Scenario Outline: "password" is filtered by default
  When I navigate to the URL "/filters/<type>/a.html"
  And the test should run in this browser
  Then I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "21"
  And the event "user.password" equals "[FILTERED]"
    Examples:
      | type       |
      | script     |

Scenario Outline: User setting can override defaults
  When I navigate to the URL "/filters/<type>/b.html"
  And the test should run in this browser
  Then I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "21"
  And the event "user.password" equals "123456"
  And the event "user.secret" equals "[FILTERED]"
  And the event "metaData.details.api_key" equals "[FILTERED]"
    Examples:
      | type       |
      | script     |

Scenario Outline: it only removes properties from specific payload subtrees
  When I navigate to the URL "/filters/<type>/c.html"
  And the test should run in this browser
  Then I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "21"
  And the event "user.password" equals "123456"
  And the event "user.secret" equals "[FILTERED]"
  And the event "metaData.details.stacktrace" equals "[FILTERED]"
  And the "file" of stack frame 0 ends with "c.html"
    Examples:
      | type       |
      | script     |

Scenario Outline: it works with regexes
  When I navigate to the URL "/filters/<type>/d.html"
  And the test should run in this browser
  Then I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.details0" equals "[FILTERED]"
  And the event "metaData.details1" equals "[FILTERED]"
  And the event "metaData.details2" equals "[FILTERED]"
  And the event "metaData.detailsA" equals "aaaa"
    Examples:
      | type       |
      | script     |
