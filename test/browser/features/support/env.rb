require 'yaml'

def get_test_url(path)
  host = ENV['HOST']
  notify = "http://#{ENV['API_HOST']}:#{Maze.config.port}/notify"
  sessions = "http://#{ENV['API_HOST']}:#{Maze.config.port}/sessions"
  config_query_string = "NOTIFY=#{notify}&SESSIONS=#{sessions}&API_KEY=#{$api_key}"

  uri = URI("http://#{host}:#{FIXTURES_SERVER_PORT}#{path}")

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

Before('@skip_ie_8') do |scenario|
  browser = Maze.config.browser
  skip_this_scenario unless browser != "ie_8"
end

Before('@skip_ie_9') do |scenario|
  browser = Maze.config.browser
  skip_this_scenario unless browser != "ie_9"
end

Before('@skip_ie_10') do |scenario|
  browser = Maze.config.browser
  skip_this_scenario unless browser != "ie_10"
end

Before('@skip_ie_11') do |scenario|
  browser = Maze.config.browser
  skip_this_scenario unless browser != "ie_11"
end

Before('@skip_safari_6') do |scenario|
  browser = Maze.config.browser
  skip_this_scenario unless browser != "safari_6"
end

Before('@skip_firefox_30') do |scenario|
  browser = Maze.config.browser
  skip_this_scenario unless browser != "firefox_30"
end

BeforeAll do
  Maze.config.receive_no_requests_wait = 15
  Maze.config.enforce_bugsnag_integrity = false

  ERRORS = YAML::load open 'features/fixtures/browser_errors.yml'
  FIXTURES_SERVER_PORT = '9020'

  # start a web server to serve fixtures
  if ENV['DEBUG']
    pid = Process.spawn({"PORT"=>FIXTURES_SERVER_PORT},
                        'ruby features/lib/server.rb')
  else
    DEV_NULL = Gem.win_platform? ? 'NUL' : '/dev/null'
    pid = Process.spawn({"PORT"=>FIXTURES_SERVER_PORT},
                        'ruby features/lib/server.rb',
                        :out => DEV_NULL,
                        :err => DEV_NULL)
  end
  Process.detach(pid)
end

at_exit do
  # Stop the web page server
  begin
    Process.kill('KILL', pid)
  rescue
  end
end
