@before_send
Feature: beforeSend callbacks

Scenario Outline: modifying report via beforeSend in config
  When I navigate to the URL "/before_send/<type>/a.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.before_send.global" equals "works"
    Examples:
      | type       |
      | script     |

Scenario Outline: ignoring report via beforeSend in config (return false)
  When I navigate to the URL "/before_send/<type>/b.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive no requests
    Examples:
      | type       |
      | script     |

Scenario Outline: ignoring report via beforeSend in config (report.ignore())
  When I navigate to the URL "/before_send/<type>/c.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive no requests
    Examples:
      | type       |
      | script     |

Scenario Outline: setting beforeSend in notify opts
  When I navigate to the URL "/before_send/<type>/d.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.before_send.notify_opts" equals "works"
    Examples:
      | type       |
      | script     |

Scenario Outline: ignoring report via beforeSend in notify opts (return false)
  When I navigate to the URL "/before_send/<type>/e.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive no requests
    Examples:
      | type       |
      | script     |

Scenario Outline: ignoring report via beforeSend in notify opts (report.ignore())
  When I navigate to the URL "/before_send/<type>/f.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive no requests
    Examples:
      | type       |
      | script     |
