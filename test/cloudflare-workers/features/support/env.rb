BeforeAll do
  success = system(File.realpath("#{__dir__}/../scripts/build-fixtures.rb"))

  unless success
    puts "Unable to build fixtures!"
    exit 1
  end

  Maze.config.enforce_bugsnag_integrity = false
  Maze.config.receive_no_requests_wait = 10
  Maze.config.receive_requests_wait = 10
end

After do
  Maze::Runner.kill_running_scripts
end