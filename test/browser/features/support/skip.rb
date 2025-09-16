Before('@skip_http') do |_scenario|
    skip_this_scenario("Skipping scenario") if Maze.config.https == false
end

["chrome", "firefox", "safari", "edge", "ie", "ios"].each do |browser|
    Before("@skip_#{browser}") do
      skip_this_scenario("Skipping scenario: Not supported on #{browser}") if Maze.config.browser.include?("#{browser}")
    end

    1.upto(200) do |version|
        Before("@skip_#{browser}_#{version}") do
            skip_this_scenario("Skipping scenario: Not supported on #{browser} #{version}") if Maze.config.browser == "#{browser}_#{version}"
        end
        Before("@skip_before_#{browser}_#{version}") do
            if Maze.config.browser.include?("#{browser}")
                browser_version = Maze.config.browser.sub("#{browser}_", "").to_i
                skip_this_scenario("Skipping scenario: Not supported on #{browser} #{version}") if browser_version < version
            end
        end
    end
end
