Given("the element {string} is present") do |element_id|
  wait_on_element(element_id)
end

When("I click the element {string}") do |element_id|
  click_element(element_id)
end