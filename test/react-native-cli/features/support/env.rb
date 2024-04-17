BeforeAll do
  $api_key = '1234567890ABCDEF1234567890ABCDEF'

  # Build requests are JSON but do not have the integrity header by design
  Maze.config.enforce_bugsnag_integrity = false
end

Before('@ios_only') do |_scenario|
  skip_this_scenario("Skipping scenario") unless Maze::Helper.get_current_platform == 'ios'
end
