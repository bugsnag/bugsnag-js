Given("the element {string} is present") do |element_id|
  wait_on_element(element_id)
end

When("I click the element {string}") do |element_id|
  click_element(element_id)
end

Given("I send the app to the background for {int} seconds") do |timeout|
  timeout_app(timeout)
end

When("I rotate the device") do
  rotate_device
end

When("I activate and then disable airplane mode") do
  toggle_airplane_mode
end

Given("I select the scenario {string}") do |scenario|
  set_dropdown_value("scenarioPicker", scenario)
end