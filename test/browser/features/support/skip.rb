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

Before('@skip_http') do |_scenario|
    skip_this_scenario("Skipping scenario") if Maze.config.https == false
end


["chrome", "firefox", "safari", "edge"].each do |browser|
  1.upto(1_000) do |version|
    Before("@skip_#{browser}_#{version}") do
      skip_this_scenario("Skipping scenario: Not supported") if Maze.config.browser == "#{browser}_#{version}"
    end
  end
end
