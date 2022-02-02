BeforeAll do
  Maze.config.receive_no_requests_wait = 30
  Maze.config.receive_requests_wait = 30
end

Before('@android_only') do |scenario|
  skip_this_scenario("Skipping scenario") if Maze.driver.capabilities["os"] == 'ios'
end

Before('@ios_only') do |scenario|
  skip_this_scenario("Skipping scenario") if Maze.driver.capabilities["os"] == 'android'
end

Before('@navigation') do |scenario|
  skip_this_scenario("Skipping scenario") if ENV['SKIP_NAVIGATION_SCENARIOS'] == 'true'
end
