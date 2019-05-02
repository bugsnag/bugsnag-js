require 'json'

require_relative '../lib/browserstack_driver'

BROWSER_STACK_URI = "https://api-cloud.browserstack.com/app-automate/upload"
ANDROID_78_SKIP = ['ANDROID_7', 'ANDROID_8']

@bs_username = ENV['BROWSER_STACK_USERNAME']
@bs_access_key = ENV['BROWSER_STACK_ACCESS_KEY']
@bs_local_id = ENV['BROWSER_STACK_LOCAL_IDENTIFIER'] || 'mazzzzeee'
@device_type = ENV['DEVICE_TYPE']

@bs_app_url = nil

$bs_driver = nil

def upload_app
  res = `curl -u "#{@bs_username}:#{@bs_access_key}" -X POST "#{BROWSER_STACK_URI}" -F "file=@#{ENV['APP_LOCATION']}"`
  resData = JSON.parse(res)
  if resData.include?('error')
    puts "BrowserStack upload failed due to error: #{resData['error']}"
    exit(false)
  else
    @bs_app_url = resData['app_url']
  end
end

def start_driver
  unless $bs_driver
    $bs_driver = BSAppAutomator::Driver.new(@device_type, @bs_app_url, @bs_username, @bs_access_key, @bs_local_id)
    $bs_driver.start_local
    $bs_driver.start_driver
  end
end

def wait_on_element(element)
  unless $bs_driver.nil?
    $bs_driver.wait_for_element(element)
  end
end

def click_element(element)
  unless $bs_driver.nil?
    $bs_driver.click_element(element)
  end
end

def set_dropdown_value(element, value)
  unless $bs_driver.nil?
    $bs_driver.click_element(element)
    sleep(1)
    $bs_driver.click_named_element(value)
  end
end

def timeout_app(timeout)
  unless $bs_driver.nil?
    $bs_driver.background_app(timeout)
  end
end

def stop_driver
  unless $bs_driver.nil?
    $bs_driver.stop_driver
    $bs_driver = nil
  end
end

FAILED_SCENARIO_OUTPUT_PATH = File.join(Dir.pwd, 'maze_output')

def write_failed_requests_to_disk(scenario)
  Dir.mkdir(FAILED_SCENARIO_OUTPUT_PATH) unless Dir.exists? FAILED_SCENARIO_OUTPUT_PATH
  Dir.chdir(FAILED_SCENARIO_OUTPUT_PATH) do
    date = DateTime.now.strftime('%d%m%y%H%M%S%L')
    Server.stored_requests.each_with_index do |request, i|
      filename = "#{scenario.name}-request#{i}-#{date}.log"
      File.open(filename, 'w+') do |file|
        file.puts "URI: #{request[:request].request_uri}"
        file.puts "HEADERS:"
        request[:request].header.each do |key, values|
          file.puts "  #{key}: #{values.map {|v| "'#{v}'"}.join(' ')}"
        end
        file.puts
        file.puts "BODY:"
        file.puts JSON.pretty_generate(request[:body])
      end
    end
  end
end

Before('@skipAndroid78') do |scenario|
  skip_this_scenario if ANDROID_78_SKIP.include?(@device_type)
end

# Reset the app between each run
After do |scenario|
  unless $bs_driver.nil?
    $bs_driver.reset_app
  end
  write_failed_requests_to_disk(scenario) if scenario.failed?
end

# Ensure the browserstack instance is stopped
at_exit do
  stop_driver
end

# Setup driver ready for tests
unless @bs_username && @bs_access_key
  puts "BrowserStack credentials not set-up correctly"
  exit(false)
end

unless @device_type
  puts "Test device type not defined, exiting"
  exit(false)
end

upload_app
start_driver