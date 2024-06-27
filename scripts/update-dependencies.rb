#! /usr/bin/env ruby

require 'bumpsnag'

target_submodule = ENV['TARGET_SUBMODULE']
target_version = ENV['TARGET_VERSION']

if target_submodule.nil? || target_version.nil?
  raise 'Submodule or version targets not provided, exiting'
  exit(1)
end

pp "Attempting upgrade of #{target_submodule} to #{target_version}"

if target_submodule.eql?('bugsnag-android')
  `packages/react-native/update-android.sh --version #{target_version}`
elsif target_submodule.eql?('bugsnag-cocoa')
  `packages/react-native/update-ios.sh --version #{target_version}`
else
  raise "Submodule #{target_submodule} not supported, exiting"
end
