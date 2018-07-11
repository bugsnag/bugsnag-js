@user
Feature: Configuring user info

Scenario Outline: setting user in config
  When I navigate to the URL "/user_info/<type>/a.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "cjhc01kh00000mcojaw8jqag8"
    Examples:
      | type       |
      | script     |

Scenario Outline: setting user on client
  When I navigate to the URL "/user_info/<type>/b.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "cjhc05e8u0000peojhf4vfd68"
    Examples:
      | type       |
      | script     |

Scenario Outline: setting user in notify opts
  When I navigate to the URL "/user_info/<type>/c.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "cjhc05lp80000psoj7g2crz7e"
    Examples:
      | type       |
      | script     |

Scenario Outline: setting user in beforeSend callback
  When I navigate to the URL "/user_info/<type>/d.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "cjhc06q3d0000q9ojtam2y3w5"
    Examples:
      | type       |
      | script     |

Scenario Outline: not setting user
  When I navigate to the URL "/user_info/<type>/e.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" is null
    Examples:
      | type       |
      | script     |
