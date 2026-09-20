BeforeAll do
  $api_key = "12312312312312312312312312312312"

  Maze.config.receive_no_requests_wait = 30
  Maze.config.receive_requests_wait = 30
  if Maze.config.farm == :bb
    Maze.config.android_app_files_directory = '/data/local/tmp'
  end
end

Before do
  Maze::Api::Appium::DeviceManager.new.set_rotation(:portrait)

  # Push fixture config directly to app sandbox on Android 15
  if Maze.driver && Maze::Helper.get_current_platform == 'android'
    config = JSON.generate({ maze_address: Maze.public_address })
    begin
      Maze.driver.push_file('/sdcard/Android/data/com.reactnative/files/fixture_config.json', config)
    rescue => e
      $logger.warn "Failed to push to app sandbox: #{e.message}"
    end
  end
end