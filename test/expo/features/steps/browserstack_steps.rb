Given("the element {string} is present") do |element_id|
  wait_on_element(element_id)
end

When("I click the element {string}") do |element_id|
  click_element(element_id)
end

Given("I send the app to the background for {int} seconds") do |timeout|
  timeout_app(timeout)
end

Given("I select the scenario {string}") do |scenario|
  set_dropdown_value("scenarioPicker", scenario)
end

Then("the event {string} equals one of:") do |field, values|
  key_path = "events.0.#{field}"
  assert_includes(values.raw.flatten, read_key_path(Server.current_request[:body], key_path))
end

Then("the event does not have a {string} breadcrumb named {string}") do |type, name|
  value = Server.current_request[:body]["events"].first["breadcrumbs"]
  found = false
  value.each do |crumb|
    if crumb["type"] == type and crumb["name"] == name then
      found = true
    end
  end
  fail("A breadcrumb was found matching: #{value}") if found
end