require 'net/http'

# Attempts to POST a string of urlencoded data to a server.
#
# @step_input reqbody [String] urlencoded data to send.
# @step_input url [String] The URL to post data to.
When("I POST the data {string} to the URL {string}") do |reqbody, url|
  Net::HTTP.post(URI(url), reqbody)
end
