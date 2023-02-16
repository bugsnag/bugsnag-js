require 'yaml'

def get_test_url(path)
  host = ENV['HOST']
  notify = "http://#{ENV['API_HOST']}:#{Maze.config.port}/notify"
  sessions = "http://#{ENV['API_HOST']}:#{Maze.config.port}/sessions"
  logs = "http://#{ENV['API_HOST']}:#{Maze.config.port}/logs"
  reflect = "http://#{ENV['API_HOST']}:#{Maze.config.port}/reflect"
  config_query_string = "NOTIFY=#{notify}&SESSIONS=#{sessions}&API_KEY=#{$api_key}&LOGS=#{logs}&REFLECT=#{reflect}"

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

ERRORS = YAML::load_file('features/fixtures/browser_errors.yml')

ERRORS.keys.each do |browser|
  Before("@skip_#{browser}") do |scenario|
    skip_this_scenario if Maze.config.browser == browser
  end
end
BeforeAll do
  Maze.config.receive_no_requests_wait = 15
  Maze.config.enforce_bugsnag_integrity = false

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
