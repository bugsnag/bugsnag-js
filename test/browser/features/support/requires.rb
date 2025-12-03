Before('@requires_array_from') do |_scenario|
  skip_this_scenario("Skipping scenario on #{$browser.name} as it does not support Array.from") unless $browser.supports_array_from?
end

Before('@requires_error_cause') do |_scenario|
  skip_this_scenario("Skipping scenario on #{$browser.name} as it does not support error.cause") unless $browser.supports_error_cause?
end

Before('@requires_fetch') do |_scenario|
  skip_this_scenario("Skipping scenario on #{$browser.name} as it does not support fetch()") unless $browser.supports_fetch?
end

Before('@requires_history_management') do |_scenario|
  skip_this_scenario("Skipping scenario on #{$browser.name} as it does not support history management") unless $browser.supports_history_management?
end

Before('@requires_let') do |_scenario|
  skip_this_scenario("Skipping scenario on #{$browser.name} as it does not support let") unless $browser.supports_let?
end

Before('@requires_promise') do |_scenario|
  skip_this_scenario("Skipping scenario on #{$browser.name} as it does not support Promises") unless $browser.supports_promise?
end

Before('@requires_proxy') do |_scenario|
  skip_this_scenario("Skipping scenario on #{$browser.name} as it does not support Proxy") unless $browser.supports_proxy?
end

Before('@requires_set') do |_scenario|
  skip_this_scenario("Skipping scenario on #{$browser.name} as it does not support Set") unless $browser.supports_set?
end

Before('@requires_unhandled_rejection') do |_scenario|
  skip_this_scenario("Skipping scenario on #{$browser.name} as it does not support onunhandledrejection") unless $browser.supports_unhandled_rejection?
end

Before('@requires_weak_map') do |_scenario|
  skip_this_scenario("Skipping scenario on #{$browser.name} as it does not support WeakMap") unless $browser.supports_weak_map?
end

Before('@requires_xml_http_request') do |_scenario|
  skip_this_scenario("Skipping scenario on #{$browser.name} as it does not support XMLHttpRequest") unless $browser.supports_xml_http_request?
end
