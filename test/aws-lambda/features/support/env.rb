BeforeAll do

  puts(system('docker -v'))

  success = system(File.realpath("#{__dir__}/../scripts/build-fixtures"))

  unless success
    puts "Unable to build fixtures!"
    exit 1
  end

  Maze.config.enforce_bugsnag_integrity = false
  Maze.config.receive_no_requests_wait = 10
  Maze.config.receive_requests_wait = 10
end
