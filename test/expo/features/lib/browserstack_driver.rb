require 'appium_lib'
require 'open3'
require_relative './fast-selenium'
require_relative './devices.rb'

module BSAppAutomator
  class Driver
    attr_reader :driver

    def initialize(target_device, app_url, username, access_key, local_id)
      @access_key = access_key
      @local_id = local_id
      caps = {}
      caps.merge! Devices::DEVICE_HASH[target_device]
      caps['browserstack.local'] = 'true'
      caps['browserstack.localIdentifier'] = local_id
      caps['browserstack.console'] = 'errors'
      caps['app'] = app_url
      @appium_driver = Appium::Driver.new({
        'caps' => caps,
        'appium_lib' => {
          :server_url => "http://#{username}:#{access_key}@hub-cloud.browserstack.com/wd/hub"
        }
      }, true)
    end

    def start_driver
      @driver = @appium_driver.start_driver
    end

    def stop_driver
      @driver.quit
    end

    def start_local
      status = nil
      Open3.popen2("/BrowserStackLocal -d start --key #{@access_key} --local-identifier #{@local_id} --force-local") do |stdin, stdout, wait|
        status = wait.value
      end
      status
    end

    def wait_for_element(element_id, timeout=30)
      wait = Selenium::WebDriver::Wait.new(:timeout => timeout)
      wait.until { self.driver.find_element(:accessibility_id, element_id).displayed? }
    end

    def click_element(element_id)
      @driver.find_element(:accessibility_id, element_id).click unless @driver.nil?
    end

    def reset_app
      @driver.reset
    end
  end
end
