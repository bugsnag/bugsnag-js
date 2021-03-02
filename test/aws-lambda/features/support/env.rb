require 'maze/server'

# FIXME: this is a temporary workaround that binds the Maze::Server to 0.0.0.0
#        so that it is reachable from the docker containers started by AWS SAM
#        This can be removed when PLAT-6116 is done
module Maze
  class Server
    class << self
      def start
        attempts = 0
        $logger.info "Maze Runner v#{Maze::VERSION}"
        $logger.info 'Starting mock server'
        loop do
          @thread = Thread.new do
            server = WEBrick::HTTPServer.new(
              BindAddress: '0.0.0.0',
              Port: PORT,
              Logger: $logger,
              AccessLog: []
            )

            # Mount a block to respond to all requests with status:200
            server.mount_proc '/' do |_request, response|
              $logger.info 'Received request on server root, responding with 200'
              response.header['Access-Control-Allow-Origin'] = '*'
              response.body = 'Maze runner received request'
              response.status = 200
            end

            # When adding more endpoints, be sure to update the 'I should receive no requests' step
            server.mount '/notify', Servlet, errors
            server.mount '/sessions', Servlet, sessions
            server.mount '/builds', Servlet, builds
            # server.mount '/logs', LogServlet
            server.start
          rescue StandardError => e
            $logger.warn "Failed to start mock server: #{e.message}"
          ensure
            server&.shutdown
          end

          # Need a short sleep here as a dying thread is still alive momentarily
          sleep 1
          break if running?

          # Bail out after 3 attempts
          attempts += 1
          raise 'Too many failed attempts to start mock server' if attempts == 3

          # Failed to start - sleep before retrying
          $logger.info 'Retrying in 5 seconds'
          sleep 5
        end
      end
    end
  end
end

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
