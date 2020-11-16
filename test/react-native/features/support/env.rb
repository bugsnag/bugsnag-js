Before('@android_only') do |scenario|
  skip_this_scenario("Skipping scenario") if MazeRunner.driver.capabilities["os"] == 'ios'
end

Before('@ios_only') do |scenario|
  skip_this_scenario("Skipping scenario") if MazeRunner.driver.capabilities["os"] == 'android'
end

Before('@navigation') do |scenario|
  skip_this_scenario("Skipping scenario") if ENV['SKIP_NAVIGATION_SCENARIOS'] == 'true'
end
