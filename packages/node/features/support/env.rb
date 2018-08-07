require 'os'

# Any 'run once' setup should go here as this file is evaluated
# when the environment loads.
# Any helper functions added here will be available in step
# definitions

require_relative '../lib/install_dependencies.rb'

# Scenario hooks
Before do
# Runs before every Scenario
end

After do
# Runs after every Scenario
end

at_exit do
# Runs when the test run is completed
end

def current_ip
  if OS.mac?
    'host.docker.internal'
  else
    ip_addr = `ifconfig | grep -Eo 'inet (addr:)?([0-9]*\\\.){3}[0-9]*' | grep -v '127.0.0.1'`
    ip_list = /((?:[0-9]*\.){3}[0-9]*)/.match(ip_addr)
    ip_list.captures.first
  end
end
