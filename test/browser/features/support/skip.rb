Before('@skip_http') do |_scenario|
    skip_this_scenario("Skipping scenario") if Maze.config.https == false
end

# Dynamic hooks for browser version checking
Before do |scenario|
    # Get all tags for the scenario
    tags = scenario.source_tag_names
    
    tags.each do |tag|
        # Handle @skip_browser tags (e.g., @skip_chrome)
        if tag.match(/^@skip_(chrome|edge|firefox|ie|ios|safari)$/)
            browser = $1
            if Maze.config.browser.start_with?("#{browser}")
                skip_this_scenario("Skipping scenario: Not supported on #{browser}")
            end
        end

        # Handle @skip_browser_version tags (e.g., @skip_chrome_85)
        if tag.match(/^@skip_(chrome|edge|firefox|ie|ios|safari)_(\d+)$/)
            browser = $1
            version = $2
            if Maze.config.browser == "#{browser}_#{version}"
                skip_this_scenario("Skipping scenario: Not supported on #{browser} #{version}")
            end
        end
        
        # Handle @skip_before_browser_version tags (e.g., @skip_before_chrome_85)
        if tag.match(/^@skip_before_(chrome|edge|firefox|ie|ios|safari)_(\d+)$/)
            browser = $1
            version = $2.to_i
            if Maze.config.browser.start_with?("#{browser}_")
                browser_version = Maze.config.browser.sub("#{browser}_", "")
                compare_version = browser_version == 'latest' ? Float::INFINITY : browser_version.to_i
                if compare_version < version
                    skip_this_scenario("Skipping scenario: Not supported on #{browser} versions before #{version}")
                end
            end
        end
    end
end