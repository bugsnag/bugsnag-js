success = system(File.realpath("#{__dir__}/../scripts/build-fixtures"))

raise "Unable to build fixtures!" unless success
