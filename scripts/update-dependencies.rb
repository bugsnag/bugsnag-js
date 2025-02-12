#!/usr/bin/env ruby
target_submodule = ENV['TARGET_SUBMODULE'].dup
target_version = ENV['TARGET_VERSION'].dup

if target_submodule.nil? || target_version.nil?
  raise 'Submodule or version targets not provided, exiting'
  exit(1)
end

pp "Attempting upgrade of #{target_submodule} to #{target_version}"

target_version.delete_prefix!('v') if target_version.start_with?('v')

if target_submodule.eql?('bugsnag-android')
  `packages/react-native/update-android.sh --version #{target_version}`
elsif target_submodule.eql?('bugsnag-cocoa')
  `packages/react-native/update-ios.sh --version #{target_version}`
else
  raise "Submodule #{target_submodule} not supported, exiting"
end
