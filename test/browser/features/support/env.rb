require 'yaml'

Maze.hooks.before_all do
  Maze.config.document_server_root = File.realpath("#{__dir__}/../fixtures")
end

def get_test_url(path)

  if Maze.config.aws_public_ip
    maze_runner = Maze.public_address
  else
    maze_runner = "#{ENV['HOST']}:#{Maze.config.port}"
  end

  notify = "https://#{maze_runner}/notify"
  sessions = "https://#{maze_runner}/sessions"
  logs = "https://#{maze_runner}/logs"
  reflect= "https://#{maze_runner}/reflect"
  config_query_string = "NOTIFY=#{notify}&SESSIONS=#{sessions}&API_KEY=#{$api_key}&LOGS=#{logs}&REFLECT=#{reflect}"

  uri = URI("https://#{maze_runner}/docs#{path}")

  if uri.query
    uri.query += "&#{config_query_string}"
  else
    uri.query = config_query_string
  end

  uri.to_s
end

def get_error_message id
  browser = Maze.config.browser
  raise "The browser '#{browser}' does not exist in 'browser_errors.yml'" unless ERRORS.has_key?(browser)

  ERRORS[browser][id]
end

Before('@skip_if_local_storage_is_unavailable') do |scenario|
  skip_this_scenario unless Maze.driver.local_storage?
end

ERRORS = YAML::load_file('features/fixtures/browser_errors.yml')

ERRORS.keys.each do |browser|
  Before("@skip_#{browser}") do |scenario|
    skip_this_scenario if Maze.config.browser == browser
  end
end
BeforeAll do
  Maze.config.receive_no_requests_wait = 15
  Maze.config.enforce_bugsnag_integrity = false
end

at_exit do
  # Stop the web page server
  begin
    Process.kill('KILL', pid)
  rescue
  end
end
