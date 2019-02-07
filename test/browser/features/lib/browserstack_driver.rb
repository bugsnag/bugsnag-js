require 'selenium-webdriver'
require_relative './fast-selenium'
require 'yaml'

def browsers
  YAML::load open 'features/browsers.yml'
end

def bs_local_id
  ENV['BROWSER_STACK_LOCAL_IDENTIFIER'] || 'mazzzzeee'
end

def driver_start
  caps = Selenium::WebDriver::Remote::Capabilities.new
  caps['browserstack.local'] = 'true'
  caps['browserstack.localIdentifier'] = bs_local_id
  caps['browserstack.console'] = 'errors'
  caps.merge! browsers[ENV['BROWSER']]
  Selenium::WebDriver.for :remote,
    url: "http://#{ENV['BROWSER_STACK_USERNAME']}:#{ENV['BROWSER_STACK_ACCESS_KEY']}@hub.browserstack.com/wd/hub",
    desired_capabilities: caps
end

def bs_local_start
  system "/BrowserStackLocal -d start --key #{ENV['BROWSER_STACK_ACCESS_KEY']} --local-identifier #{bs_local_id} --force-local"
end
