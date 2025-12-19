#!/usr/bin/env ruby

require "fileutils"

# Allow specifying a specific fixture to build by passing it's name as an argument
# e.g. ./build-fixtures simple-app
SPECIFIC_FIXTURE = ARGV.first

# Allow debugging by logging more verbosely and not tidying up packed packages
DEBUG = ["1", "true", true].include?(ENV.fetch("DEBUG", false))

# The root of bugsnag-js
ROOT = File.realpath("#{__dir__}/../../../../")

# Bugsnag packages that we need to pack & install into the fixtures
BUGSNAG_PACKAGES = [
  "core",
  "delivery-node",
  "in-flight",
  "js",
  "node",
  "plugin-app-duration",
  "plugin-cloudflare-workers",
  "plugin-contextualize",
  "plugin-express",
  "plugin-hono",
  "plugin-intercept",
  "plugin-node-device",
  "plugin-node-in-project",
  "plugin-node-surrounding-code",
  "plugin-node-uncaught-exception",
  "plugin-node-unhandled-rejection",
  "plugin-server-session",
  "plugin-strip-project-root",
]

def heading(message)
  <<~HEADING
  ====#{"=" * message.length}====
  =   #{message}   =
  ====#{"=" * message.length}====
  HEADING
end

# Build Bugsnag packages so they're ready to install
def build
  Dir.chdir(ROOT) do
    system("npm ci")
    system("npm run build")
  end
end

# Run "npm pack" on the required packages and strip the version suffix so they
# can be depended on in a package.json file
def pack
  puts heading("Packing Bugsnag packages")

  BUGSNAG_PACKAGES.each do |package|
    path = "#{ROOT}/packages/#{package}"
    flags = DEBUG ? "--verbose" : "--quiet"

    success = system("npm pack #{flags} #{path}/")

    raise "Failed to pack #{package}" unless success
  end

  # Strip the version suffix from the packages
  Dir["#{FileUtils.pwd}/bugsnag-*.tgz"].each do |package|
    package_with_no_version = package.gsub(/-\d+\.\d+\.\d+.*(?=\.tgz)/, '')
    File.rename(package, package_with_no_version)
  end
end

# Install the packed packages in each fixture and build the fixture
def install_and_build
  Dir["#{__dir__}/../fixtures/*"].each do |fixture|
    fixture = File.realpath(fixture)
    fixture_name = File.basename(fixture)

    if SPECIFIC_FIXTURE && SPECIFIC_FIXTURE != fixture_name
      puts heading("Not building #{fixture_name} because it's not '#{SPECIFIC_FIXTURE}'")
      next
    end

    puts heading("Installing Bugsnag packages in #{fixture_name}")

    FileUtils.copy(Dir["#{FileUtils.pwd}/bugsnag-*.tgz"], fixture)
    system("npm install --prefix #{fixture} #{fixture}/bugsnag-*.tgz")

    unless DEBUG
      # Remove the packages from the fixture directories as they aren't
      # needed anymore. A built lambda has them in its node_modules directory
      FileUtils.remove(Dir["#{fixture}/bugsnag-*.tgz"])

    end

  end
end

# Tidy up PWD by removing all the packed packages created by "pack"
def tidy_up
  return if DEBUG

  puts heading("Tidying up PWD")

  FileUtils.remove(Dir["#{FileUtils.pwd}/bugsnag-*.tgz"])
end

begin
  build
  pack
  install_and_build
ensure
  tidy_up

  puts "Done!"
end
