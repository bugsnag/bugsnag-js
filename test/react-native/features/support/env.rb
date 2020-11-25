AfterConfiguration do |_config|
  MazeRunner.config.receive_no_requests_wait = 15
  # TODO: Remove once the Bugsnag-Integrity header has been implemented
  MazeRunner.config.enforce_bugsnag_integrity = false
end

Before('@android_only') do |scenario|
  skip_this_scenario("Skipping scenario") if MazeRunner.driver.capabilities["os"] == 'ios'
end

Before('@ios_only') do |scenario|
  skip_this_scenario("Skipping scenario") if MazeRunner.driver.capabilities["os"] == 'android'
end

Before('@navigation') do |scenario|
  skip_this_scenario("Skipping scenario") if ENV['SKIP_NAVIGATION_SCENARIOS'] == 'true'
end
