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

Then("the Bugsnag-Integrity header is valid") do
  raw_request = Server.current_request[:request]

  type, value = raw_request['Bugsnag-Integrity'].split(' ')

  assert_equal('simple', type)
  assert_equal(raw_request.body.bytesize, value.to_i)
end
