Before('@requires_promises') do |_scenario|
  skip_this_scenario("Skipping scenario on #{$browser.name} as it does not support Promises") unless $browser.supports_promise?
end


