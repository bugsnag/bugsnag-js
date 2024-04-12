Given('I setup the environment') do
  steps %Q{
    Given I store the api key in the environment variable "BUGSNAG_API_KEY"
    And I set environment variable "BUGSNAG_NOTIFY_ENDPOINT" to "http://host.docker.internal:9339/notify"
    And I set environment variable "BUGSNAG_SESSIONS_ENDPOINT" to "http://host.docker.internal:9339/sessions"
  }
end

