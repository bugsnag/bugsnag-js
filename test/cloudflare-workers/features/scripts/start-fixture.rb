#!/usr/bin/env ruby

require "fileutils"

FIXTURE_NAME = ARGV.first

FIXTURE_DIR = File.realpath("#{__dir__}/../fixtures/#{FIXTURE_NAME}")

Dir.chdir(FIXTURE_DIR) do
  system("npm run start")
end