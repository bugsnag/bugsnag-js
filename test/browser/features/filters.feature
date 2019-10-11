@filters
Feature: Filtering sensitive content from payload

Scenario: "password" is filtered by default
  When I navigate to the URL "/filters/script/a.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "21"
  And the event "user.password" equals "[Filtered]"

Scenario: User setting can override defaults
  When I navigate to the URL "/filters/script/b.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "21"
  And the event "user.password" equals "123456"
  And the event "user.secret" equals "[Filtered]"
  And the event "metaData.details.api_key" equals "[Filtered]"

Scenario: it only removes properties from specific payload subtrees
  When I navigate to the URL "/filters/script/c.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "21"
  And the event "user.password" equals "123456"
  And the event "user.secret" equals "[Filtered]"
  And the event "metaData.details.stacktrace" equals "[Filtered]"
  And the "method" of stack frame 0 equals "handle"

Scenario: it works with regexes
  When I navigate to the URL "/filters/script/d.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.details0" equals "[Filtered]"
  And the event "metaData.details1" equals "[Filtered]"
  And the event "metaData.details2" equals "[Filtered]"
  And the event "metaData.detailsA" equals "aaaa"
