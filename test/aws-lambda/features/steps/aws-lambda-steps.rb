Given('I setup the environment') do
  if ENV['NETWORK_NAME']
    host_name = 'host.docker.internal'
  else
    # Use the default for docker bridge host
    host_name = '172.17.0.1'
  end
  steps %Q{
    Given I store the api key in the environment variable "BUGSNAG_API_KEY"
    And I set environment variable "BUGSNAG_NOTIFY_ENDPOINT" to "http://#{host_name}:9339/notify"
    And I set environment variable "BUGSNAG_SESSIONS_ENDPOINT" to "http://#{host_name}:9339/sessions"
  }
end

Then('the lambda response {string} has at least its configured minimum length') do |key_path|
  Maze.check.not_nil(Maze::Aws::Sam.last_response, 'No lambda response!')

  actual = Maze::Helper.read_key_path(Maze::Aws::Sam.last_response, key_path)
  expected_length = LambdaConfig.minimum_length_for(key_path)

  Maze.check.kind_of(Array, actual)
  Maze.check.true(
    actual.length >= expected_length,
    "Field '#{key_path}' has #{actual.length} elements; expected at least #{expected_length}"
  )
end

Then('the lambda response {string} is an array with the configured length for {string}') do |key_path, lambda_name|
  Maze.check.not_nil(Maze::Aws::Sam.last_response, 'No lambda response!')

  actual = Maze::Helper.read_key_path(Maze::Aws::Sam.last_response, key_path)
  expected_length = LambdaConfig.trace_length_for(lambda_name)

  Maze.check.kind_of(Array, actual)
  Maze.check.equal(expected_length, actual.length)
end
