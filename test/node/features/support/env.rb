AfterConfiguration do |_config|
  MazeRunner.config.receive_no_requests_wait = 15
  MazeRunner.config.enforce_bugsnag_integrity = false
end
