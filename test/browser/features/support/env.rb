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

def get_test_url path
  "http://#{ENV['HOST']}:#{FIXTURES_SERVER_PORT}#{path}?ENDPOINT=#{URI::encode("http://#{ENV['API_HOST']}:#{MOCK_API_PORT}")}&API_KEY=#{URI::encode($api_key)}"
end


def get_error_message id
  browser = ENV['BROWSER']
  raise "The browser '#{browser}' does not exist in 'browser_errors.yml'" unless ERRORS.has_key?(browser)

  ERRORS[browser][id]
end

# check if Selenium supports running javascript in the current browser
def can_run_javascript
  $driver.execute_script('return true')
rescue Selenium::WebDriver::Error::UnsupportedOperationError
  false
end

# check if the browser supports local storage, e.g. safari 10 on browserstack
# does not have working local storage
def has_local_storage
  # Assume we can use local storage if we aren't able to verify by running JavaScript
  return true unless can_run_javascript

  $driver.execute_script <<-JAVASCRIPT
  try {
    window.localStorage.setItem('__localstorage_test__', 1234)
    window.localStorage.removeItem('__localstorage_test__')

    return true
  } catch (err) {
    return false
  }
  JAVASCRIPT
end

Before('@skip_if_local_storage_is_unavailable') do |scenario|
  skip_this_scenario unless has_local_storage
end

AfterConfiguration do
  # Necessary as Appium removes any existing $driver instance on load
  bs_local_start
  $driver = driver_start
end

at_exit do
  # Runs when the test run is completed
  $driver.quit
  begin
    Process.kill('KILL', pid)
  rescue
  end
end
