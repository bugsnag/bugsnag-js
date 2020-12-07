AfterConfiguration do |_config|
  MazeRunner.config.receive_no_requests_wait = 15 if MazeRunner.config.respond_to? :receive_no_requests_wait=
  # TODO: Remove once the Bugsnag-Integrity header has been implemented
  MazeRunner.config.enforce_bugsnag_integrity = false if MazeRunner.config.respond_to? :enforce_bugsnag_integrity=
end

Before('@skip_android_5') do |scenario|
  if MazeRunner.driver.capabilities['os'] == 'android' and MazeRunner.config.os_version.floor == 5
    skip_this_scenario("Skipping Android 5")
  end
end

Before('@skip_android_7') do |scenario|
  if MazeRunner.driver.capabilities['os'] == 'android' and MazeRunner.config.os_version.floor == 7
    skip_this_scenario("Skipping Android 7")
  end
end

Before('@skip_android_8') do |scenario|
  if MazeRunner.driver.capabilities['os'] == 'android' and MazeRunner.config.os_version.floor == 8
    skip_this_scenario("Skipping Android 8")
  end
end

Before('@skip_ios_10') do |scenario|
  if MazeRunner.driver.capabilities['os'] == 'ios' and MazeRunner.config.os_version.floor == 10
    skip_this_scenario("Skipping iOS 10")
  end
end

Before('@skip_ios_11') do |scenario|
  if MazeRunner.driver.capabilities['os'] == 'ios' and MazeRunner.config.os_version.floor == 11
    skip_this_scenario("Skipping iOS 11")
  end
end

Before('@skip_ios_12') do |scenario|
  if MazeRunner.driver.capabilities['os'] == 'ios' and MazeRunner.config.os_version.floor == 12
    skip_this_scenario("Skipping iOS 12")
  end
end
