require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))
Pod::Spec.new do |s|
  s.name         = "BugsnagReactNative"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = "Bugsnag crash and error reporting for React Native apps"
  s.homepage     = "https://github.com/bugsnag/"
  s.license      = "MIT"
  s.author       = { "Bugsnag" => "platforms@bugsnag.com" }
  s.platform     = :ios, "7.0"
  s.source       = { :git => "https://github.com/bugsnag/bugsnag-js.git", :tag => "v#{s.version}" }
  s.source_files = "ios/BugsnagReactNative/**/*.{h,m}",
                   "ios/vendor/bugsnag-cocoa/**/*.{h,mm,m,cpp,c}",
  # s.public_header_files = "ios/Bugsnag/**/*.h"
  s.requires_arc = true
  s.dependency "React"
  #s.dependency "others"
end
