AfterConfiguration do |_config|
  Maze.config.receive_no_requests_wait = 15 if Maze.config.respond_to? :receive_no_requests_wait=
end

Before('@android_only') do |scenario|
  skip_this_scenario("Skipping scenario") if Maze.driver.capabilities["os"] == 'ios'
end

Before('@ios_only') do |scenario|
  skip_this_scenario("Skipping scenario") if Maze.driver.capabilities["os"] == 'android'
end

Before('@navigation') do |scenario|
  skip_this_scenario("Skipping scenario") if ENV['SKIP_NAVIGATION_SCENARIOS'] == 'true'
end

Before do |scenario|
  driver = Maze.driver
  driver.click_element_if_present("android:id/button1")
  driver.click_element_if_present("android:id/aerr_close")
  driver.click_element_if_present("android:id/aerr_restart")
end
