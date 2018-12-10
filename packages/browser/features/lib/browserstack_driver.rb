require 'selenium-webdriver'
require_relative './fast-selenium'
require 'browserstack/local'
require 'yaml'

def browsers
  YAML::load open 'features/browsers.yml'
end

def bs_local_id
  ENV['BROWSERSTACK_LOCAL_IDENTIFIER'] || 'mazzzzeee'
end

def bs_local_args
  {
    'key' => ENV['BROWSER_STACK_ACCESS_KEY'],
    'v' => 'true',
    'force' => 'true',
    'localIdentifier' => bs_local_id
  }
end

def driver_start
  caps = Selenium::WebDriver::Remote::Capabilities.new
  caps['browserstack.local'] = 'true'
  # caps['browserstack.localIdentifier'] = bs_local_id
  caps['browserstack.console'] = 'errors'
  caps.merge! browsers[ENV['BROWSER']]
  Selenium::WebDriver.for :remote,
    url: "http://#{ENV['BROWSER_STACK_USERNAME']}:#{ENV['BROWSER_STACK_ACCESS_KEY']}@hub.browserstack.com/wd/hub",
    desired_capabilities: caps
end

def bs_local_start
  bs_local = BrowserStack::Local.new
  bs_local.start(bs_local_args)
  bs_local
end
