Given('I store the notify endpoint in the environment variable {string}') do |name|
  step("I set environment variable '#{name}' to 'http://host.docker.internal:9339/notify'")
end

Given('I store the sessions endpoint in the environment variable {string}') do |name|
  step("I set environment variable '#{name}' to 'http://host.docker.internal:9339/sessions'")
end
