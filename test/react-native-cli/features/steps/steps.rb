current_fixture = ENV.fetch('REACT_NATIVE_VERSION', 'rn0_60')

When('I run the React Native service interactively') do
  step("I run the service '#{current_fixture}' interactively")
end
