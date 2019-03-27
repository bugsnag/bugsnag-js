require 'json'

require_relative '../lib/browserstack_driver'

BROWSER_STACK_URI = "https://api-cloud.browserstack.com/app-automate/upload"

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

def stop_driver
  unless $bs_driver.nil?
    $bs_driver.stop_driver
    $bs_driver = nil
  end
end

# Reset the app between each run
After do
  unless $bs_driver.nil?
    $bs_driver.reset_app
  end
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