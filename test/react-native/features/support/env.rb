bs_username = ENV['BROWSER_STACK_USERNAME']
bs_access_key = ENV['BROWSER_STACK_ACCESS_KEY']
bs_local_id = ENV['BROWSER_STACK_LOCAL_IDENTIFIER'] || 'mazzzzeee'
app_location = ENV['APP_LOCATION']

def device_type
  ENV['DEVICE_TYPE']
end

Before('@skip_android_5') do |scenario|
  skip_this_scenario("Skipping scenario") if device_type == 'ANDROID_5'
end

Before('@skip_android_7') do |scenario|
  skip_this_scenario("Skipping scenario") if device_type == 'ANDROID_7'
end

Before('@skip_android_8') do |scenario|
  skip_this_scenario("Skipping scenario") if device_type == 'ANDROID_8'
end

Before('@skip_ios_10') do |scenario|
  skip_this_scenario("Skipping scenario") if device_type == 'IOS_10'
end

Before('@skip_ios_11') do |scenario|
  skip_this_scenario("Skipping scenario") if device_type == 'IOS_11'
end

Before('@skip_ios_12') do |scenario|
  skip_this_scenario("Skipping scenario") if device_type == 'IOS_12'
end

Before('@android_only') do |scenario|
  skip_this_scenario("Skipping scenario") if $driver.capabilities["os"] == 'ios'
end

Before('@ios_only') do |scenario|
  skip_this_scenario("Skipping scenario") if $driver.capabilities["os"] == 'android'
end

Before('@navigation') do |scenario|
  skip_this_scenario("Skipping scenario") if ENV['SKIP_NAVIGATION_SCENARIOS'] == 'true'
end

After do |_scenario|
  $driver.reset_with_timeout
end

AfterConfiguration do |config|
  AppAutomateDriver.new(bs_username, bs_access_key, bs_local_id, device_type, app_location, :accessibility_id)
  $driver.start_driver
  $driver.reset
end

# Ensure the browserstack instance is stopped
at_exit do
  $driver.driver_quit if $driver
end
