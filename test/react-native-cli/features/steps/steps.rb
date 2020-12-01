fixtures = Dir["#{__dir__}/../fixtures/rn0_*"].map { |dir| File.basename(dir) }.sort
current_fixture = ENV['REACT_NATIVE_VERSION']

unless fixtures.include?(current_fixture)
  if current_fixture.nil?
    message = <<~ERROR.chomp
      \e[31;1mNo React Native fixture given!\e[0m

      Set the 'REACT_NATIVE_VERSION' environment variable to one of the React Native fixtures
    ERROR
  else
    message = "\e[31;1mInvalid fixture: #{current_fixture.inspect}!\e[0m"
  end

  raise <<~ERROR

    #{message}

    Valid fixtures are:
      - #{fixtures.join("\n  - ")}
  ERROR
end

When('I run the React Native service interactively') do
  step("I run the service '#{current_fixture}' interactively")
end

When('I press enter') do
  step('I input "" interactively')
end

When('I wait for the shell to output the following to stdout') do |expected|
  wait = Maze::Wait.new(timeout: MazeRunner.config.receive_requests_wait)

  success = wait.until do
    stdout = Runner.interactive_session.stdout_lines.join("\n")

    stdout.include?(expected)
  end

  assert(
    success,
    <<~ERROR
      Did not find the expected message in stdout

      stdout:
      #{Runner.interactive_session.stdout_lines.inspect}
    ERROR
  )
end

Then("I wait for the shell to output a line containing {string} to stdout") do |expected|
  wait = Maze::Wait.new(timeout: MazeRunner.config.receive_requests_wait)
  success = wait.until do
    Runner.interactive_session.stdout_lines.any? do |line|
      line.include?(expected)
    end
  end

  assert(
    success,
    <<~ERROR
      No stdout lines contained '#{expected}'

      stdout:
      #{Runner.interactive_session.stdout_lines.inspect}
    ERROR
  )
end

Then("I wait for the current stdout line to contain {string}") do |expected|
  wait = Maze::Wait.new(timeout: MazeRunner.config.receive_requests_wait)
  wait.until do
    Runner.interactive_session.current_buffer.include?(expected)
  end

  assert_includes(Runner.interactive_session.current_buffer, expected)
end

def parse_package_json
  before = Runner.interactive_session.stdout_lines.dup

  steps %Q{
    When I input "cat package.json" interactively
    Then I wait for the shell to output '"dependencies": \{' to stdout
  }

  after = Runner.interactive_session.stdout_lines

  difference = after - before

  # Drop lines that include the cat command above. This will sometimes appear
  # once and sometimes appear twice, depending on if another command is running
  # when it's input
  json = difference.drop_while { |line| line.include?('cat package.json') }

  JSON.parse(json.join("\n"))
end

Then("bugsnag has been added to the package.json file") do
  json = parse_package_json

  assert_includes(json, "dependencies")
  assert_includes(json["dependencies"], "@bugsnag/react-native")
end

Then("bugsnag version {string} has been added to the package.json file") do |expected|
  json = parse_package_json

  assert_includes(json, "dependencies")
  assert_includes(json["dependencies"], "@bugsnag/react-native")
  assert_equal(json["dependencies"]["@bugsnag/react-native"], expected)
end

Then("bugsnag has not been added to the package.json file") do
  json = parse_package_json

  assert_includes(json, "dependencies")
  refute_includes(json["dependencies"], "@bugsnag/react-native")
end
