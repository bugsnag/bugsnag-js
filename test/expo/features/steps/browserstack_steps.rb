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