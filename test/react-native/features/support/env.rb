BeforeAll do
  Maze.config.receive_no_requests_wait = 30
  Maze.config.receive_requests_wait = 30
  if Maze.config.farm == :bb
    Maze.config.android_app_files_directory = '/data/local/tmp'
  end
end

Before do
  # See https://www.browserstack.com/docs/app-automate/appium/troubleshooting/app-orientation-issues
  Maze.driver.set_rotation(:portrait)
end

Before('@android_only') do |_scenario|
  skip_this_scenario("Skipping scenario") unless Maze::Helper.get_current_platform == 'android'
end

Before('@ios_only') do |_scenario|
  skip_this_scenario("Skipping scenario") unless Maze::Helper.get_current_platform == 'ios'
end

Before('@navigation') do |scenario|
  skip_this_scenario("Skipping scenario") if ENV['SKIP_NAVIGATION_SCENARIOS'].eql?('true')
end

# Require until PLAT-8236 is implemented
Before('@skip_hermes') do |_scenario|
  skip_this_scenario("Skipping scenario") if ENV['HERMES'].eql?('true')
end
