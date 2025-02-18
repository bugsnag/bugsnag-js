Given('I setup the environment') do
  if ENV['NETWORK_NAME']
    host_name = 'host.docker.internal'
  else
    # Use the default for docker bridge host
    host_name = '172.17.0.1'
  steps %Q{
    Given I store the api key in the environment variable "BUGSNAG_API_KEY"
    And I set environment variable "BUGSNAG_NOTIFY_ENDPOINT" to "http://#{host_name}:9339/notify"
    And I set environment variable "BUGSNAG_SESSIONS_ENDPOINT" to "http://#{host_name}:9339/sessions"
  }
end
