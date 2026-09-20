BeforeAll do
  $api_key = "12312312312312312312312312312312"

  Maze.config.receive_no_requests_wait = 30
  Maze.config.receive_requests_wait = 30
  if Maze.config.farm == :bb
    Maze.config.android_app_files_directory = '/data/local/tmp'
  end
end

def is_android?
  return true if Maze.config.os&.downcase == 'android'
  return true if Maze.config.device&.downcase&.include?('android')
  return true if Maze::Helper.get_current_platform&.downcase == 'android'
  return true if Maze.driver && Maze.driver.capabilities['platformName']&.downcase == 'android'
  false
end

def is_ios?
  return true if Maze.config.os&.downcase == 'ios'
  return true if Maze.config.device&.downcase&.include?('ios')
  return true if Maze::Helper.get_current_platform&.downcase == 'ios'
  return true if Maze.driver && Maze.driver.capabilities['platformName']&.downcase == 'ios'
  false
end

Before do
  Maze::Api::Appium::DeviceManager.new.set_rotation(:portrait)
end

Before('@android_only') do |scenario|
  skip_this_scenario("Skipping scenario on non-Android") unless is_android?
end

Before('@ios_only') do |scenario|
  skip_this_scenario("Skipping scenario on non-iOS") if is_android? || !is_ios?
end

Before('@navigation') do |scenario|
  skip_this_scenario("Skipping scenario") if ENV['SKIP_NAVIGATION_SCENARIOS'].eql?('true')
end

Before('@react_navigation') do |scenario|
  skip_this_scenario("Skipping scenario: Not running react-navigation fixture") unless ENV["REACT_NAVIGATION"] == 'true'
end

Before('@react-native-navigation') do |scenario|
  skip_this_scenario("Skipping scenario") unless ENV['REACT_NATIVE_NAVIGATION'].eql?('true')
end

Before('@skip_hermes') do |_scenario|
  skip_this_scenario("Skipping scenario") if ENV['HERMES'].eql?('true')
end

Before('@skip_new_arch') do |scenario|
  skip_this_scenario("Skipping scenario") if ENV['RCT_NEW_ARCH_ENABLED'].eql?('1')
end

Before('@skip_old_arch') do |scenario|
  skip_this_scenario("Skipping scenario") unless ENV['RCT_NEW_ARCH_ENABLED'].eql?('1')
end

Before('@skip_new_arch_below_074') do |scenario|
  current_version = ENV['RN_VERSION'].nil? ? 0 : ENV['RN_VERSION'].to_f
  skip_this_scenario("Skipping scenario") if ENV['RCT_NEW_ARCH_ENABLED'].eql?('1') && current_version < 0.74
end