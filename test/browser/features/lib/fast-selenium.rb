# copy pasta from https://www.browserstack.com/automate/ruby
require 'selenium/webdriver/remote/http/curb'

module Selenium
  module WebDriver
    module Remote
      class Bridge
        attr_accessor :http_curb
        def http
          unless @http_curb
            @http_curb = Http::Curb.new
            @http_curb.server_url = @http.send(:server_url)
          end
          @http_curb
        end
      end # Bridge
    end # Remote
  end # WebDriver
end # Selenium
