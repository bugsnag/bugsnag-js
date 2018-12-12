# Any 'run once' setup should go here as this file is evaluated
# when the environment loads.
# Any helper functions added here will be available in step
# definitions

require 'yaml'
require 'test/unit'
include Test::Unit::Assertions

require_relative '../lib/browserstack_driver'
# require_relative '../lib/fixture_package_jsons'
#
# puts 'installing dependencies'
# require_relative '../lib/install_dependencies'

$errors = YAML::load open 'features/fixtures/browser_errors.yml'
$port = "9020"

puts 'starting web server for fixtures'
# start a web server to serve fixtures
if ENV['VERBOSE']
  pid = Process.spawn({"PORT"=>$port}, 'ruby features/lib/server.rb')
else
  pid = Process.spawn({"PORT"=>$port}, 'ruby features/lib/server.rb', :out => DEV_NULL, :err => DEV_NULL)
end
Process.detach(pid)

puts 'starting browserstack local'
bs_local = bs_local_start

puts 'starting webdriver'
$driver = driver_start

# Scenario hooks
Before do
  # Runs before every Scenario
end

# $fixtures_built = Hash.new
# get_package_jsons_for_fixtures.each do |pkg|
#   fixture_dirname = File.basename(File.expand_path(File.join(pkg, '..', '..')))
#   iteration_dirname = File.basename(File.expand_path(File.join(pkg, '..')))
#   puts "adding '@#{fixture_dirname}' build hook for #{iteration_dirname}"
#   Before "@#{fixture_dirname}" do
#     unless $fixtures_built[pkg]
#       $fixtures_built[pkg] = true
#       Dir.chdir(File.dirname pkg) do
#         run_command('npm run build')
#       end
#     end
#   end
# end

# test helpers

# def current_ip
#   # Parses the output of `ifconfig` to retreive the host IP for docker to talk to
#   # Breaks compatability with Windows
#   ip_addr = `ifconfig | grep -Eo 'inet (addr:)?([0-9]*\\\.){3}[0-9]*' | grep -v '127.0.0.1'`
#   ip_list = /((?:[0-9]*\.){3}[0-9]*)/.match(ip_addr)
#   ip_list.captures.first
# end

def current_ip
  'localhost'
end

def get_test_url path
  endpoint = "http://#{current_ip}:#{@script_env['MOCK_API_PORT']}"
  "http://#{current_ip}:#{$port}#{path}?ENDPOINT=#{URI::encode(endpoint)}"
end

def get_error_message id
  msg = $errors[ENV['BROWSER']]
  msg[id]
end

After do
  # Runs after every Scenario
  $driver.navigate.to 'about:blank'
end

at_exit do
  # Runs when the test run is completed
  $driver.quit
  # unless ENV['TRAVIS']
  #   bs_local.stop
  # end
  begin
    Process.kill('KILL', pid)
  rescue
  end
end
