require 'rexml/document'
require 'securerandom'

current_fixture = ENV['RN_VERSION']
fixture_dir = "#{__dir__}/../../../react-native-cli/features/fixtures/generated/"
generate_fixture_script = "#{__dir__}/../../../../scripts/generate-react-native-cli-fixture.js"

# if RCT_NEW_ARCH_ENABLED is set add new-arch/ to the fixture_dir
if ENV['RCT_NEW_ARCH_ENABLED'] == 'true' || ENV['RCT_NEW_ARCH_ENABLED'] == '1'
  fixture_dir += "new-arch/#{ENV['RN_VERSION']}"
else
  fixture_dir += "old-arch/#{ENV['RN_VERSION']}"
end

When('I run the React Native service interactively') do
  step("I run the service '#{current_fixture}' interactively")
end

When('I build the Android app') do
  $logger.info `node #{generate_fixture_script}`

  # Change directory to fixture_dir
  Dir.chdir(fixture_dir) do
    $logger.info `npm run bugsnag:upload-rn-android -- --overwrite`
  end
end

When('I build the iOS app') do
  $logger.info `node #{generate_fixture_script}`

  # Change directory to fixture_dir
  Dir.chdir(fixture_dir) do
    $logger.info `npm run bugsnag:upload-rn-ios -- --overwrite`
  end
end

When('I export the iOS archive') do
  script_path = "#{__dir__}/../../../../scripts/react-native/ios-utils.js"
  $logger.info `node -e 'require("#{script_path}").buildIPA("#{fixture_dir}")'`
end

When('the APK file exists') do
  apk_path = "#{fixture_dir}/reactnative.apk"
  Maze.check.true(File.exist?(apk_path))
end

When('the IPA file exists') do
  ipa_path = "#{fixture_dir}/output/reactnative.ipa"
  Maze.check.true(File.exist?(ipa_path))
end

def parse_package_json
  stdout_lines = Maze::Runner.interactive_session.stdout_lines
  length_before = stdout_lines.length

  steps %Q{
    When I input "cat package.json" interactively
    Then I wait for the shell to output '"dependencies": \{' to stdout
  }

  after = stdout_lines[length_before..stdout_lines.length]

  # Drop lines until we get to the start of the JSON
  json = after.drop_while { |line| line != '{' }

  JSON.parse(json.join("\n"))
end

Then('bugsnag source maps library is in the package.json file') do
  json = parse_package_json

  Maze.check.include(json, 'devDependencies')
  Maze.check.include(json['devDependencies'], '@bugsnag/source-maps')
end

Then('bugsnag cli library is in the package.json file') do
  json = parse_package_json

  Maze.check.include(json, 'devDependencies')
  Maze.check.include(json['devDependencies'], '@bugsnag/cli')
end

Then('bugsnag source maps library version {string} is in the package.json file') do |expected|
  json = parse_package_json

  Maze.check.include(json, 'devDependencies')
  Maze.check.include(json['devDependencies'], '@bugsnag/source-maps')
  Maze.check.equal(json['devDependencies']['@bugsnag/source-maps'], expected)
end

Then('bugsnag cli library version {string} is in the package.json file') do |expected|
  json = parse_package_json

  Maze.check.include(json, 'devDependencies')
  Maze.check.include(json['devDependencies'], '@bugsnag/cli')
  Maze.check.equal(json['devDependencies']['@bugsnag/cli'], expected)
end


Then('bugsnag source maps library is not in the package.json file') do
  json = parse_package_json

  Maze.check.include(json, 'devDependencies')
  Maze.check.not_include(json['devDependencies'], '@bugsnag/source-maps')
end

Then('the iOS build has not been modified to upload source maps') do
  filename = "ios/#{current_fixture}.xcodeproj/project.pbxproj"

  step("the interactive file '#{filename}' does not contain 'EXTRA_PACKAGER_ARGS=\"--sourcemap-output $TMPDIR/$(md5 -qs \"$CONFIGURATION_BUILD_DIR\")-main.jsbundle.map\"'")
  step("the interactive file '#{filename}' does not contain 'Upload source maps to Bugsnag'")
end

Then('the iOS build has been modified to upload source maps') do
  filename = "ios/#{current_fixture}.xcodeproj/project.pbxproj"

  steps %Q{
    Then I input "./check-ios-build-script.sh" interactively
    And I wait for the current stdout line to match the regex "\/app #"
    And the last interactive command exited successfully
    And the interactive file '#{filename}' contains 'Upload source maps to Bugsnag'
  }
end

Then('the iOS build has been modified to upload source maps to {string}') do |expected_endpoint|
  filename = "ios/#{current_fixture}.xcodeproj/project.pbxproj"

  steps %Q{
    Then I input "./check-ios-build-script.sh #{expected_endpoint}" interactively
    And I wait for the current stdout line to match the regex "\/app #"
    And the last interactive command exited successfully
    And the interactive file '#{filename}' contains 'Upload source maps to Bugsnag'
  }
end

Then('the Android build has not been modified to upload source maps') do
  steps %Q{
    Then the interactive file 'android/app/build.gradle' does not contain 'uploadReactNativeMappings = true'
    And the interactive file 'android/app/build.gradle' does not contain 'endpoint = '
    And the interactive file 'android/app/build.gradle' does not contain 'releasesEndpoint = '
  }
end

Then('the Android build has been modified to upload source maps') do
  steps %Q{
    Then the interactive file 'android/app/build.gradle' contains 'uploadReactNativeMappings = true'
    And the interactive file 'android/app/build.gradle' does not contain 'endpoint = '
    And the interactive file 'android/app/build.gradle' does not contain 'releasesEndpoint = '
  }
end

Then('the Android build has been modified to upload source maps to {string}') do |expected_endpoint|
  step("the interactive file 'android/app/build.gradle' contains 'uploadReactNativeMappings = true'")
  step("the interactive file 'android/app/build.gradle' contains 'endpoint = \"#{expected_endpoint}\"'")
end

Then('the Android build has been modified to upload builds to {string}') do |expected_endpoint|
  step("the interactive file 'android/app/build.gradle' contains 'releasesEndpoint = \"#{expected_endpoint}\"'")
end

Then('the Bugsnag Android Gradle plugin is not installed') do
  rootGradle = 'android/build.gradle'
  appGradle = 'android/app/build.gradle'

  step("the interactive file '#{rootGradle}' does not contain 'classpath(\"com.bugsnag:bugsnag-android-gradle-plugin:'")
  step("the interactive file '#{appGradle}' does not contain 'apply plugin: \"com.bugsnag.android.gradle\"'")
end

Then('the Bugsnag Android Gradle plugin is installed') do
  rootGradle = 'android/build.gradle'
  appGradle = 'android/app/build.gradle'

  step("the interactive file '#{rootGradle}' contains 'classpath(\"com.bugsnag:bugsnag-android-gradle-plugin:'")
  step("the interactive file '#{appGradle}' contains 'apply plugin: \"com.bugsnag.android.gradle\"'")
end

Then('bugsnag react-native is in the package.json file') do
  json = parse_package_json

  Maze.check.include(json, 'dependencies')
  Maze.check.include(json['dependencies'], '@bugsnag/react-native')
end

Then('bugsnag react-native version {string} is in the package.json file') do |expected|
  json = parse_package_json

  Maze.check.include(json, 'dependencies')
  Maze.check.include(json['dependencies'], '@bugsnag/react-native')
  Maze.check.equal(json['dependencies']['@bugsnag/react-native'], expected)
end

Then('bugsnag react-native is not in the package.json file') do
  json = parse_package_json

  Maze.check.include(json, 'dependencies')
  Maze.check.not_include(json['dependencies'], '@bugsnag/react-native')
end

Then('the iOS app contains the bugsnag initialisation code') do
  filename = "ios/#{current_fixture}/AppDelegate.m"

  step("the interactive file '#{filename}' contains '#import <Bugsnag/Bugsnag.h>'")
  step("the interactive file '#{filename}' contains '[Bugsnag start];'")
end

def get_android_main_application_path
  "android/app/src/main/java/com/reactnative/MainApplication.java"
end

Then('the Android app contains the bugsnag initialisation code') do
  filename = get_android_main_application_path
  step("the interactive file '#{filename}' contains 'import com.bugsnag.android.Bugsnag;'")
  step("the interactive file '#{filename}' contains 'Bugsnag.start(this);'")
end

Then('the iOS app does not contain the bugsnag initialisation code') do
  filename = "ios/#{current_fixture}/AppDelegate.m"

  step("the interactive file '#{filename}' does not contain '#import <Bugsnag/Bugsnag.h>'")
  step("the interactive file '#{filename}' does not contain '[Bugsnag start];'")
end

Then('the Android app does not contain the bugsnag initialisation code') do
  filename = get_android_main_application_path
  step("the interactive file '#{filename}' does not contain 'import com.bugsnag.android.Bugsnag;'")
  step("the interactive file '#{filename}' does not contain 'Bugsnag.start(this);'")
end

Then('the JavaScript layer contains the bugsnag initialisation code') do
  steps %Q{
    Then the interactive file 'index.js' contains:
      """
      import Bugsnag from "@bugsnag/react-native";
      Bugsnag.start();
      """
  }
end

Then('the JavaScript layer does not contain the bugsnag initialisation code') do
  steps %Q{
    Then the interactive file 'index.js' does not contain:
      """
      import Bugsnag from "@bugsnag/react-native";
      Bugsnag.start();
      """
  }
end

Then('the modified files are as expected after running the insert command') do
  steps %Q{
    When I input "git status --porcelain" interactively
    Then I wait for the interactive shell to output the following lines in stdout
      """
      M #{get_android_main_application_path}
      M index.js
      M ios/#{current_fixture}/AppDelegate.m
      """
  }
end

Then('the modified files are as expected after running the configure command') do
  steps %Q{
    When I input "git status --porcelain" interactively
    Then I wait for the interactive shell to output the following lines in stdout
      """
      M android/app/src/main/AndroidManifest.xml
      M ios/#{current_fixture}/Info.plist
      """
  }
end

Then('there are no modified files in git') do
  uuid = SecureRandom.uuid

  steps %Q{
    When I input "git status --porcelain" interactively
    And I input "[ -z $(git status --porcelain) ] && echo '#{uuid} no changes' || echo '#{uuid} changes'" interactively
    Then I wait for the shell to output "#{uuid} no changes" to stdout
  }
end

def parse_xml_file(path)
  stdout_lines = Maze::Runner.interactive_session.stdout_lines
  length_before = stdout_lines.length
  uuid = SecureRandom.uuid

  steps %Q{
    When I input "cat #{path} && echo ''" interactively
    And I input "echo #{uuid}" interactively
    Then I wait for the shell to output '#{uuid}' to stdout
  }

  after = stdout_lines[length_before..stdout_lines.length]

  # Drop lines that include the cat command above. This will sometimes appear
  # once and sometimes appear twice, depending on if another command is running
  # when it's input
  xml = after.reject do |line|
    line.include?("cat #{path}") || line.include?(uuid)
  end

  REXML::Document.new(xml.join("\n"))
end

Then('the iOS app contains the bugsnag API key {string}') do |expected|
  xml = parse_xml_file("ios/#{current_fixture}/Info.plist")

  # This XPath does the following:
  #   1. find the '<key>' with the text 'bugsnag'
  #   2. find the following '<dict>' element
  #   3. within the dict, find any '<string>' elements
  # 'get_text' will then fetch the text content of the first element
  actual_api_key = xml.get_text('//key[text()="bugsnag"]/following-sibling::dict/string')

  Maze.check.equal(expected, actual_api_key.to_s)
end

Then('the Android app contains the bugsnag API key {string}') do |expected|
  xml = parse_xml_file('android/app/src/main/AndroidManifest.xml')

  element = xml.get_elements('//meta-data[@android:name="com.bugsnag.android.API_KEY"]').first
  actual_api_key = element['android:value']

  Maze.check.equal(expected, actual_api_key.to_s)
end

Then('the iOS app does not contain a bugsnag API key') do
  xml = parse_xml_file("ios/#{current_fixture}/Info.plist")

  actual_api_key = xml.get_text('//key[text()="bugsnag"]/following-sibling::dict/string')

  Maze.check.nil(actual_api_key)
end

Then('the Android app does not contain a bugsnag API key') do
  xml = parse_xml_file('android/app/src/main/AndroidManifest.xml')

  element = xml.get_elements('//meta-data[@android:name="com.bugsnag.android.API_KEY"]').first

  Maze.check.nil(element)
end

Then('the iOS app contains the bugsnag notify URL {string}') do |expected|
  xml = parse_xml_file("ios/#{current_fixture}/Info.plist")

  # This XPath does the following:
  #   1. find the '<key>' with the text 'bugsnag'
  #   2. find the following '<dict>' element
  #   3. within the dict, find the key with text 'endpoints'
  #   4. find the following '<dict>' element
  #   5. within _that_ dict, find the key with the text 'notify'
  #   6. find the following '<string>' element
  # 'get_text' will then fetch the text content of the first element
  actual = xml.get_text('//key[text()="bugsnag"]/following-sibling::dict/key[text()="endpoints"]/following-sibling::dict/key[text()="notify"]/following-sibling::string[1]')

  Maze.check.equal(expected, actual.to_s)
end

Then('the Android app contains the bugsnag notify URL {string}') do |expected|
  xml = parse_xml_file('android/app/src/main/AndroidManifest.xml')

  element = xml.get_elements('//meta-data[@android:name="com.bugsnag.android.ENDPOINT_NOTIFY"]').first
  actual = element['android:value']

  Maze.check.equal(expected, actual.to_s)
end

Then('the iOS app does not contain a bugsnag notify URL') do
  xml = parse_xml_file("ios/#{current_fixture}/Info.plist")

  actual = xml.get_text('//key[text()="bugsnag"]/following-sibling::dict/key[text()="endpoints"]/following-sibling::dict/key[text()="notify"]/following-sibling::string[1]')

  Maze.check.nil(actual)
end

Then('the Android app does not contain a bugsnag notify URL') do
  xml = parse_xml_file('android/app/src/main/AndroidManifest.xml')

  element = xml.get_elements('//meta-data[@android:name="com.bugsnag.android.ENDPOINT_NOTIFY"]').first

  Maze.check.nil(element)
end

Then('the iOS app contains the bugsnag sessions URL {string}') do |expected|
  xml = parse_xml_file("ios/#{current_fixture}/Info.plist")

  actual = xml.get_text('//key[text()="bugsnag"]/following-sibling::dict/key[text()="endpoints"]/following-sibling::dict/key[text()="sessions"]/following-sibling::string[1]')

  Maze.check.equal(expected, actual.to_s)
end

Then('the Android app contains the bugsnag sessions URL {string}') do |expected|
  xml = parse_xml_file('android/app/src/main/AndroidManifest.xml')

  element = xml.get_elements('//meta-data[@android:name="com.bugsnag.android.ENDPOINT_SESSIONS"]').first
  actual = element['android:value']

  Maze.check.equal(expected, actual.to_s)
end

Then('the iOS app does not contain a bugsnag sessions URL') do
  xml = parse_xml_file("ios/#{current_fixture}/Info.plist")

  actual = xml.get_text('//key[text()="bugsnag"]/following-sibling::dict/key[text()="endpoints"]/following-sibling::dict/key[text()="sessions"]/following-sibling::string[1]')

  Maze.check.nil(actual)
end

Then('the Android app does not contain a bugsnag sessions URL') do
  xml = parse_xml_file('android/app/src/main/AndroidManifest.xml')

  element = xml.get_elements('//meta-data[@android:name="com.bugsnag.android.ENDPOINT_SESSIONS"]').first

  Maze.check.nil(element)
end

Then('the Content-Type header is valid multipart form-data') do
  expected = /^multipart\/form-data; boundary=--------------------------\d+$/
  actual = Maze::Server.builds.current[:request]['content-type']
  Maze.check.match(expected, actual)
end

Then('the sourcemaps Content-Type header is valid multipart form-data') do
  expected = /^multipart\/form-data; boundary=([^;]+)/
  actual = Maze::Server.sourcemaps.current[:request]['content-type']
  Maze.check.match(expected, actual)
end

def rn_version_less_than(string_value, float_value)
  stripped_string = string_value[2..-1]
  replaced_string = stripped_string.gsub("_", ".")
  converted_float = replaced_string.to_f
  return converted_float < float_value
end

When('RN version is 0.68 or lower dismiss the warning message') do
  rn_version_lower = rn_version_less_than(ENV['REACT_NATIVE_VERSION'], 0.69)
  case rn_version_lower
  when true
    steps %Q{
    And I wait for the interactive shell to output the following lines in stdout
        """
        You are running a version of React Native that we cannot automatically integrate with due to known issues with the build when Hermes is enabled.

        If you cannot upgrade to a later version of React Native (version 0.68 or above), you can use an older version of this CLI (version 7.20.x or earlier)

        or follow the manual integration instructions in our online docs: https://docs.bugsnag.com/platforms/react-native/react-native/manual-setup/')
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
  }
  end
end
