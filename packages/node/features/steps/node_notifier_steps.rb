require 'net/http'

When("I configure the bugsnag notify endpoint") do
  steps %Q{
    When I set environment variable "BUGSNAG_NOTIFY_ENDPOINT" to "http://#{current_ip}:#{MOCK_API_PORT}"
  }
end

When("I configure the bugsnag sessions endpoint") do
  steps %Q{
    When I set environment variable "BUGSNAG_SESSIONS_ENDPOINT" to "http://#{current_ip}:#{MOCK_API_PORT}"
  }
end

Then("the request used the Node notifier") do
  steps %Q{
    Then the payload field "notifier.name" equals "Bugsnag Node"
    And the payload field "notifier.url" equals "https://github.com/bugsnag/bugsnag-js"
  }
end

Then("the request used payload v4 headers") do
  steps %Q{
    Then the "bugsnag-api-key" header is not null
    And the "bugsnag-payload-version" header equals "4.0"
    And the "bugsnag-sent-at" header is a timestamp
  }
end

When("I wait for the app to respond on port {string}") do |port|
  max_attempts = 10
  attempts = 0
  up = false
  until (attempts >= max_attempts) || up
    attempts += 1
    begin
      uri = URI("http://localhost:#{port}/")
      response = Net::HTTP.get_response(uri)
      up = (response.code == "200")
    rescue EOFError, Errno::ECONNREFUSED, Errno::ECONNRESET => e
    end
    sleep 1
  end
  raise "App not ready in time!" unless up
end
