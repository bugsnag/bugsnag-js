require 'net/http'

# Attempts to POST a string of urlencoded data to a server.
#
# @step_input reqbody [String] urlencoded data to send.
# @step_input url [String] The URL to post data to.
When("I POST the data {string} to the URL {string}") do |reqbody, url|
  Net::HTTP.post(URI(url), reqbody)
end

When('I open the URL {string} tolerating any error') do |url|
  begin
    open(url, &:read)
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

  assert_same(
    expected_response_code,
    response.code.to_i,
    <<~TEXT
      Unexpected response code "#{response.code}" received. Response body:

      #{response.body}
    TEXT
  )
end
