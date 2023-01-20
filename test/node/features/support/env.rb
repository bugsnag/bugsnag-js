BeforeAll do
  Maze.config.receive_no_requests_wait = 15
  Maze.config.enforce_bugsnag_integrity = false
end

Before('@skip_before_node_6') do |_scenario|
  node_version = ENV['NODE_VERSION'].to_i
  skip_this_scenario("Skipping scenario on Node #{node_version}") if node_version < 6
end

Before('@skip_before_node_8') do |_scenario|
  node_version = ENV['NODE_VERSION'].to_i
  skip_this_scenario("Skipping scenario on Node #{node_version}") if node_version < 8
end

Before('@skip_before_node_16') do |_scenario|
  node_version = ENV['NODE_VERSION'].to_i
  skip_this_scenario("Skipping scenario on Node #{node_version}") if node_version < 16
end

Before('@skip_before_node_18') do |_scenario|
  node_version = ENV['NODE_VERSION'].to_i
  skip_this_scenario("Skipping scenario on Node #{node_version}") if node_version < 18
end