require 'yaml'
require 'test/unit'
include Test::Unit::Assertions

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

def get_test_url path
  host = ENV['HOST']
  endpoint = URI::encode("http://#{ENV['API_HOST']}:#{Maze::Server::PORT}")
  api_key = URI::encode($api_key)
  "http://#{host}:#{FIXTURES_SERVER_PORT}#{path}?ENDPOINT=#{endpoint}&API_KEY=#{api_key}"
end

When('I navigate to the test URL {string}') do |test_path|
  path = get_test_url test_path
  steps %Q{
    I navigate to the URL "#{path}"
  }
end

Before('@skip_if_local_storage_is_unavailable') do |scenario|
  skip_this_scenario unless MazeRunner.driver.local_storage?
end

AfterConfiguration do
  MazeRunner.config.receive_no_requests_wait = 15
  MazeRunner.config.enforce_bugsnag_integrity = false
end

at_exit do
  # Stop the web page server
  begin
    Process.kill('KILL', pid)
  rescue
  end
end
