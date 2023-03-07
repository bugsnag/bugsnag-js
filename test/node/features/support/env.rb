BeforeAll do
  Maze.config.receive_no_requests_wait = 15
  Maze.config.enforce_bugsnag_integrity = false
end

(12..30).each do |version|
  Before("@skip_node_#{version}") do
    actual_version = ENV['NODE_VERSION'].to_i

    if actual_version == version
      skip_this_scenario(
        "Skipping scenario on Node #{actual_version}"
      )
    end
  end

  Before("@skip_before_node_#{version}") do
    actual_version = ENV['NODE_VERSION'].to_i

    if actual_version < version
      skip_this_scenario(
        "Skipping scenario on Node #{actual_version}"
      )
    end
  end
end