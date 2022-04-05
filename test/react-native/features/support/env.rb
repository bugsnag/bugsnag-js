BeforeAll do
  Maze.config.receive_no_requests_wait = 30
  Maze.config.receive_requests_wait = 30
end

Before('@android_only') do |scenario|
  skip_this_scenario("Skipping scenario") if Maze.driver.capabilities["os"].eql?('ios')
end

Before('@ios_only') do |scenario|
  skip_this_scenario("Skipping scenario") if Maze.driver.capabilities["os"].eql?('android')
end

Before('@navigation') do |scenario|
  skip_this_scenario("Skipping scenario") if ENV['SKIP_NAVIGATION_SCENARIOS'].eql?('true')
end

# Require until PLAT-8236 is implemented
Before('@skip_hermes') do |_scenario|
  skip_this_scenario("Skipping scenario") if ENV['HERMES'].eql?('true')
end
