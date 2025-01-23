(1..50).each do |version|
    Before("@skip_ios_#{version}") do
        if Maze.config.browser == "ios_#{version}"
            skip_this_scenario("Skipping scenario on iOS #{current_browser}")
        end
    end
  
    Before("@skip_before_ios_#{version}") do
        if Maze.config.browser.include? "ios_"
            browser_version = Maze.config.browser.sub("ios_", "").to_i
    
            if browser_version < version
                skip_this_scenario("Skipping scenario on iOS #{browser_version}")
            end
        end
    end
end
