require 'yaml'

def get_test_url path
  host = ENV['HOST']
  notify = "http://#{ENV['API_HOST']}:#{Maze.config.port}/notify"
  sessions = "http://#{ENV['API_HOST']}:#{Maze.config.port}/sessions"
  "http://#{host}:#{FIXTURES_SERVER_PORT}#{path}?NOTIFY=#{notify}&SESSIONS=#{sessions}&API_KEY=#{$api_key}"
end

def get_error_message id
  browser = Maze.config.browser
  raise "The browser '#{browser}' does not exist in 'browser_errors.yml'" unless ERRORS.has_key?(browser)

  ERRORS[browser][id]
end

Before('@skip_if_local_storage_is_unavailable') do |scenario|
  skip_this_scenario unless Maze.driver.local_storage?
end

BeforeAll do
  Maze.config.receive_no_requests_wait = 15
  Maze.config.enforce_bugsnag_integrity = false

  ERRORS = YAML::load open 'features/fixtures/browser_errors.yml'
  FIXTURES_SERVER_PORT = '9020'

  Maze.config.document_server_root = File.expand_path File.join(__dir__, '..', 'fixtures')
  Maze.config.document_server_bind_address = '0.0.0.0'
  Maze.config.document_server_port = FIXTURES_SERVER_PORT
end
