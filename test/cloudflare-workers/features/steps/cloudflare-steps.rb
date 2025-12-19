require 'net/http'

When('I start the worker {string}') do |fixture|
  steps %Q{
    Given I store the api key in the environment variable "BUGSNAG_API_KEY"
    And I set environment variable "BUGSNAG_NOTIFY_ENDPOINT" to "http://localhost:#{Maze.config.port}/notify"
    And I set environment variable "BUGSNAG_SESSIONS_ENDPOINT" to "http://localhost:#{Maze.config.port}/sessions"
  }

  command = "ruby #{File.realpath("#{__dir__}/../scripts/start-fixture.rb")} #{fixture}"
  Maze::Runner.run_command(command, blocking: false)
end

Then('I open the URL {string} and get a {int} response') do |url, expected_response_code|
  begin
    response = Net::HTTP.get_response(URI(url))
  rescue
    $logger.debug $!.inspect
  end

  Maze.check.equal(
    expected_response_code,
    response.code.to_i,
    <<~TEXT
      Unexpected response code "#{response.code}" received. Response body:

      #{response.body}
    TEXT
  )
end

When('I open the URL {string} and get a {int} response with body {string}') do |url, expected_response_code, expected_response_body|
  begin
    response = Net::HTTP.get_response(URI(url))
  rescue
    $logger.debug $!.inspect
  end

  Maze.check.equal(
    expected_response_code,
    response.code.to_i,
    <<~TEXT
      Unexpected response code "#{response.code}" received. Response body:

      #{response.body}
    TEXT
  )
  Maze.check.equal(
    expected_response_body,
    response.body,
    <<~TEXT
      Unexpected response body received. Response body:

      #{response.body}
    TEXT
  )
end