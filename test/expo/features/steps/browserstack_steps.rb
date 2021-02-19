Then("the event {string} equals one of:") do |field, expected|
  key_path = "events.0.#{field}"
  value = Maze::Helper.read_key_path(Maze::Server.errors.current[:body], key_path)
  assert_includes(expected.raw.flatten, value)
end

Then("the event does not have a {string} breadcrumb named {string}") do |type, name|
  value = Maze::Server.errors.current[:body]["events"].first["breadcrumbs"]
  found = false
  value.each do |crumb|
    if crumb["type"] == type and crumb["name"] == name then
      found = true
    end
  end
  fail("A breadcrumb was found matching: #{value}") if found
end

Then("the event {string} equals the current OS name") do |field_path|
  expected = Maze.driver.capabilities['os']
  key_path = "events.0.#{field_path}"
  actual_value = Maze::Helper.read_key_path(Maze::Server.errors.current[:body], key_path)

  assert_equal(expected, actual_value)
end
