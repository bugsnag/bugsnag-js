# Any 'run once' setup should go here as this file is evaluated
# when the environment loads.
# Any helper functions added here will be available in step
# definitions

require 'yaml'
require 'test/unit'
include Test::Unit::Assertions

require_relative '../lib/browserstack_driver'

ERRORS = YAML::load open 'features/fixtures/browser_errors.yml'
FIXTURES_SERVER_PORT = "9020"

# start a web server to serve fixtures
if ENV['VERBOSE']
  pid = Process.spawn({"PORT"=>FIXTURES_SERVER_PORT}, 'ruby features/lib/server.rb')
else
  DEV_NULL = Gem.win_platform? ? 'NUL' : '/dev/null'
  pid = Process.spawn({"PORT"=>FIXTURES_SERVER_PORT}, 'ruby features/lib/server.rb', :out => DEV_NULL, :err => DEV_NULL)
end
Process.detach(pid)

bs_local_start
$driver = driver_start

def get_test_url path
  "http://#{ENV['HOST']}:#{FIXTURES_SERVER_PORT}#{path}?ENDPOINT=#{URI::encode("http://#{ENV['API_HOST']}:#{MOCK_API_PORT}")}&API_KEY=#{URI::encode($api_key)}"
end

def get_error_message id
  ERRORS[ENV['BROWSER']][id]
end

at_exit do
  # Runs when the test run is completed
  $driver.quit
  begin
    Process.kill('KILL', pid)
  rescue
  end
end
