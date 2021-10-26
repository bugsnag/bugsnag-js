InstallPlugin do
  Maze.config.receive_no_requests_wait = 15
end

Before('@skip_android_5') do |scenario|
  if Maze.driver.capabilities['os'] == 'android' and Maze.config.os_version.floor == 5
    skip_this_scenario("Skipping Android 5")
  end
end

Before('@skip_android_7') do |scenario|
  if Maze.driver.capabilities['os'] == 'android' and Maze.config.os_version.floor == 7
    skip_this_scenario("Skipping Android 7")
  end
end

Before('@skip_android_8') do |scenario|
  if Maze.driver.capabilities['os'] == 'android' and Maze.config.os_version.floor == 8
    skip_this_scenario("Skipping Android 8")
  end
end

Before('@skip_ios_10') do |scenario|
  if Maze.driver.capabilities['os'] == 'ios' and Maze.config.os_version.floor == 10
    skip_this_scenario("Skipping iOS 10")
  end
end

Before('@skip_ios_11') do |scenario|
  if Maze.driver.capabilities['os'] == 'ios' and Maze.config.os_version.floor == 11
    skip_this_scenario("Skipping iOS 11")
  end
end

Before('@skip_ios_12') do |scenario|
  if Maze.driver.capabilities['os'] == 'ios' and Maze.config.os_version.floor == 12
    skip_this_scenario("Skipping iOS 12")
  end
end
