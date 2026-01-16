@user
Feature: Configuring user info

Scenario: setting user in config
  When I navigate to the test URL "/user_info/script/config.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "user.id" equals "cjhc01kh00000mcojaw8jqag8"

Scenario: setting user on client
  When I navigate to the test URL "/user_info/script/client.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "user.id" equals "cjhc05e8u0000peojhf4vfd68"

Scenario: setting user in onError callback
  When I navigate to the test URL "/user_info/script/on_error.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "user.id" equals "cjhc06q3d0000q9ojtam2y3w5"

Scenario: not setting user
  When I navigate to the test URL "/user_info/script/no_user.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "user.id" is null

Scenario: defaulting to device.id
  When I navigate to the test URL "/user_info/script/device_id.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "user.id" is not null

Scenario: default device.id does not override user.id
  When I navigate to the test URL "/user_info/script/user_id_holds.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "user.id" equals "123"
