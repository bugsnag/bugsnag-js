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
  s.platform     = :ios, "9.0"
  s.source       = { :git => "https://github.com/bugsnag/bugsnag-js.git", :tag => "v#{s.version}" }
  s.source_files = "ios/BugsnagReactNative/**/*.{h,m}"
  s.requires_arc = true
  s.dependency "Bugsnag", "6.21.0"
  s.dependency "React-Core"
end
