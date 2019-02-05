@user
Feature: Configuring user info

Scenario: setting user in config
  When I navigate to the URL "/user_info/script/a.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "cjhc01kh00000mcojaw8jqag8"

Scenario: setting user on client
  When I navigate to the URL "/user_info/script/b.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "cjhc05e8u0000peojhf4vfd68"

Scenario: setting user in notify opts
  When I navigate to the URL "/user_info/script/c.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "cjhc05lp80000psoj7g2crz7e"

Scenario: setting user in beforeSend callback
  When I navigate to the URL "/user_info/script/d.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" equals "cjhc06q3d0000q9ojtam2y3w5"

Scenario: not setting user
  When I navigate to the URL "/user_info/script/e.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "user.id" is null