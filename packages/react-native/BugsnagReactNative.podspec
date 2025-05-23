require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))
bugsnag_cocoa_podspec = JSON.parse(File.read(File.join(__dir__, "ios", "vendor", "bugsnag-cocoa", "Bugsnag.podspec.json")))
bugsnag_cocoa_public_header_files = bugsnag_cocoa_podspec["public_header_files"]

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
  s.source_files = "ios/BugsnagReactNative/**/*.{h,mm,m}",
                   "ios/vendor/bugsnag-cocoa/**/*.{h,mm,m,cpp,c}",
  s.public_header_files = "ios/vendor/bugsnag-cocoa/{#{bugsnag_cocoa_public_header_files.join(',')}}"
  s.header_dir = "Bugsnag"
  s.requires_arc = true
  s.resource_bundles = {
    "Bugsnag" => ["ios/vendor/bugsnag-cocoa/Bugsnag/resources/PrivacyInfo.xcprivacy"],
  }
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES"
  }

  if ENV["RCT_NEW_ARCH_ENABLED"] == "1"
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end
