AfterConfiguration do |_config|
  MazeRunner.config.receive_no_requests_wait = 15 if MazeRunner.config.respond_to? :receive_no_requests_wait=
  MazeRunner.config.enforce_bugsnag_integrity = false if MazeRunner.config.respond_to? :enforce_bugsnag_integrity=
end
