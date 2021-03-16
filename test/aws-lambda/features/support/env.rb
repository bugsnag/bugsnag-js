`command -v sam`

if $? != 0
  puts <<~ERROR
  The AWS SAM CLI must be installed before running these tests!

  See the installation instructions:
  https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html

  If you have already installed the SAM CLI, check that it's in your PATH:
  $ command -v sam
  ERROR

  exit 127
end

success = system(File.realpath("#{__dir__}/../scripts/build-fixtures"))

unless success
  puts "Unable to build fixtures!"
  exit 1
end

Maze.config.enforce_bugsnag_integrity = false
Maze.config.receive_no_requests_wait = 10
Maze.config.receive_requests_wait = 10
