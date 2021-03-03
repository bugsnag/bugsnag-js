Given('I setup the environment') do
  steps %Q{
    Given I store the api key in the environment variable "BUGSNAG_API_KEY"
    And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
    And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
  }
end

Given('I store the notify endpoint in the environment variable {string}') do |name|
  step("I set environment variable '#{name}' to 'http://host.docker.internal:9339/notify'")
end

Given('I store the sessions endpoint in the environment variable {string}') do |name|
  step("I set environment variable '#{name}' to 'http://host.docker.internal:9339/sessions'")
end
