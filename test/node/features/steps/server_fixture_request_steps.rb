require 'net/http'

# Attempts to POST a string of request body data to a server.
#
# @step_input reqbody [String] body data to send.
# @step_input url [String] The URL to post data to.
# @step_input content_type [String] The content type of the data being sent.
When("I POST the data {string} to the URL {string} with the content type {string}") do |reqbody, url, content_type|
  Net::HTTP.post(URI(url),
                 reqbody,
                 'Content-Type' => content_type)
end

When('I open the URL {string} tolerating any error') do |url|
  begin
    URI(url).open(&:read)
  rescue
    $logger.debug $!.inspect
  end
end

When('I open the URL {string} and get a {int} response') do |url, expected_response_code|
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

When('I stop all docker services') do
  Maze::Docker.down_all_services
end