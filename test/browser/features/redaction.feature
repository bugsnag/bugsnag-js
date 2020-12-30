@redaction
Feature: Filtering sensitive content from payload

Scenario: "password" is filtered by default
  When I navigate to the test URL "/redaction/script/a.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "21"
  And the event "metaData.user.password" equals "[REDACTED]"

Scenario: User setting can override defaults
  When I navigate to the test URL "/redaction/script/b.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "21"
  And the event "metaData.user.password" equals "123456"
  And the event "metaData.user.secret" equals "[REDACTED]"
  And the event "metaData.details.api_key" equals "[REDACTED]"

Scenario: it only removes properties from specific payload subtrees
  When I navigate to the test URL "/redaction/script/c.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "21"
  And the event "metaData.user.password" equals "123456"
  And the event "metaData.user.secret" equals "[REDACTED]"
  And the event "metaData.details.stacktrace" equals "[REDACTED]"
  And the "method" of stack frame 0 equals "handle"

Scenario: it works with regexes
  When I navigate to the test URL "/redaction/script/d.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.extra.details0" equals "[REDACTED]"
  And the event "metaData.extra.details1" equals "[REDACTED]"
  And the event "metaData.extra.details2" equals "[REDACTED]"
  And the event "metaData.extra.detailsA" equals "aaaa"
