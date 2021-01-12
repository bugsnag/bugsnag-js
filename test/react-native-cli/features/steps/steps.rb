require 'rexml/document'
require 'securerandom'

fixtures = Dir["#{__dir__}/../fixtures/rn0_*"].map { |dir| File.basename(dir) }.sort
current_fixture = ENV['REACT_NATIVE_VERSION']

# Ensure environment is set for the CLI tests (check not needed for device-based tests)
if MazeRunner.config.farm == :none && !fixtures.include?(current_fixture)
  if current_fixture.nil?
    message = <<~ERROR.chomp
      \e[31;1mNo React Native fixture given!\e[0m

      Set the 'REACT_NATIVE_VERSION' environment variable to one of the React Native fixtures
    ERROR
  else
    message = "\e[31;1mInvalid fixture: #{current_fixture.inspect}!\e[0m"
  end

  raise <<~ERROR

    #{message}

    Valid fixtures are:
      - #{fixtures.join("\n  - ")}
  ERROR
end

When('I run the React Native service interactively') do
  step("I run the service '#{current_fixture}' interactively")
end

When("I notify a handled JavaScript error") do
  steps %Q{
    Given the element "js_notify" is present within 60 seconds
    And I click the element "js_notify"
  }
end

When("I notify a handled native error") do
  steps %Q{
    Given the element "native_notify" is present within 60 seconds
    And I click the element "native_notify"
  }
end

# TODO(PLAT-5566) migrate to Maze Runner (this step may need a bit more specific of a name)
When('I press enter') do
  step('I input "" interactively')
end

# TODO(PLAT-5566) migrate to Maze Runner
When('I wait for the shell to output the following to stdout') do |expected|
  wait = Maze::Wait.new(timeout: MazeRunner.config.receive_requests_wait)

  success = wait.until do
    stdout = Runner.interactive_session.stdout_lines.join("\n")

    stdout.include?(expected)
  end

  assert(
    success,
    <<~ERROR
      Did not find the expected message in stdout

      stdout:
      #{Runner.interactive_session.stdout_lines.inspect}
    ERROR
  )
end

def find_cli_helper_script
  # Handle both Dockerized and local Maze Runner executions
  script = 'react-native-cli-helper.js'
  possible_locations = %W[
    #{__dir__}/../../scripts/#{script}
    #{__dir__}/../../../../scripts/#{script}
  ]
  path = possible_locations.find { |path| File.exist?(path) }
  if path.nil?
    raise <<~ERROR
      The React Native CLI helper script was not found in any of the expected locations:
        - #{possible_locations.join("\n  -")}
    ERROR
  end
  path
end

When('I build the Android app') do
  path = find_cli_helper_script
  $logger.info `node -e 'require("#{path}").buildAndroid("./features/fixtures", "./local-build")'`
end

When('I build the iOS app') do
  path = find_cli_helper_script
  $logger.info `node -e 'require("#{path}").buildIOS()'`
end

# TODO(PLAT-5566) migrate to Maze Runner
Then("I wait for the shell to output a line containing {string} to stdout") do |expected|
  wait = Maze::Wait.new(timeout: MazeRunner.config.receive_requests_wait)
  success = wait.until do
    Runner.interactive_session.stdout_lines.any? do |line|
      line.include?(expected)
    end
  end

  assert(
    success,
    <<~ERROR
      No stdout lines contained '#{expected}'

      stdout:
      #{Runner.interactive_session.stdout_lines.inspect}
    ERROR
  )
end

# TODO(PLAT-5566) migrate to Maze Runner
Then("I wait for the current stdout line to contain {string}") do |expected|
  wait = Maze::Wait.new(timeout: MazeRunner.config.receive_requests_wait)
  wait.until do
    Runner.interactive_session.current_buffer.include?(expected)
  end

  assert_includes(Runner.interactive_session.current_buffer, expected)
end

def parse_package_json
  stdout_lines = Runner.interactive_session.stdout_lines
  length_before = stdout_lines.length

  steps %Q{
    When I input "cat package.json" interactively
    Then I wait for the shell to output '"dependencies": \{' to stdout
  }

  after = stdout_lines[length_before..stdout_lines.length]

  # Drop lines that include the cat command above. This will sometimes appear
  # once and sometimes appear twice, depending on if another command is running
  # when it's input
  json = after.drop_while { |line| line.include?('cat package.json') }

  JSON.parse(json.join("\n"))
end

Then("bugsnag source maps library is in the package.json file") do
  json = parse_package_json

  assert_includes(json, "devDependencies")
  assert_includes(json["devDependencies"], "@bugsnag/source-maps")
end

Then("bugsnag source maps library version {string} is in the package.json file") do |expected|
  json = parse_package_json

  assert_includes(json, "devDependencies")
  assert_includes(json["devDependencies"], "@bugsnag/source-maps")
  assert_equal(json["devDependencies"]["@bugsnag/source-maps"], expected)
end

Then("bugsnag source maps library is not in the package.json file") do
  json = parse_package_json

  assert_includes(json, "devDependencies")
  refute_includes(json["devDependencies"], "@bugsnag/source-maps")
end

Then("the iOS build has not been modified to upload source maps") do
  filename = "ios/#{current_fixture}.xcodeproj/project.pbxproj"

  step("the file '#{filename}' does not contain 'EXTRA_PACKAGER_ARGS=\"--sourcemap-output $CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/main.jsbundle.map\"'")
  step("the file '#{filename}' does not contain 'Upload source maps to Bugsnag'")
end

Then("the iOS build has been modified to upload source maps") do
  filename = "ios/#{current_fixture}.xcodeproj/project.pbxproj"

  steps %Q{
    Then I input "./check-ios-build-script.sh" interactively
    And I wait for the current stdout line to contain "/app #"
    And the last interactive command exited successfully
    And the file '#{filename}' contains 'Upload source maps to Bugsnag'
  }
end

Then("the iOS build has been modified to upload source maps to {string}") do |expected_endpoint|
  filename = "ios/#{current_fixture}.xcodeproj/project.pbxproj"

  steps %Q{
    Then I input "./check-ios-build-script.sh #{expected_endpoint}" interactively
    And I wait for the current stdout line to contain "/app #"
    And the last interactive command exited successfully
    And the file '#{filename}' contains 'Upload source maps to Bugsnag'
  }
end

Then("the Android build has not been modified to upload source maps") do
  steps %Q{
    Then the file 'android/app/build.gradle' does not contain 'uploadReactNativeMappings = true'
    And the file 'android/app/build.gradle' does not contain 'endpoint = '
    And the file 'android/app/build.gradle' does not contain 'releasesEndpoint = '
  }
end

Then("the Android build has been modified to upload source maps") do
  steps %Q{
    Then the file 'android/app/build.gradle' contains 'uploadReactNativeMappings = true'
    And the file 'android/app/build.gradle' does not contain 'endpoint = '
    And the file 'android/app/build.gradle' does not contain 'releasesEndpoint = '
  }
end

Then("the Android build has been modified to upload source maps to {string}") do |expected_endpoint|
  step("the file 'android/app/build.gradle' contains 'uploadReactNativeMappings = true'")
  step("the file 'android/app/build.gradle' contains 'endpoint = \"#{expected_endpoint}\"'")
end

Then("the Android build has been modified to upload builds to {string}") do |expected_endpoint|
  step("the file 'android/app/build.gradle' contains 'releasesEndpoint = \"#{expected_endpoint}\"'")
end

Then("the Bugsnag Android Gradle plugin is not installed") do
  rootGradle = "android/build.gradle"
  appGradle = "android/app/build.gradle"

  step("the file '#{rootGradle}' does not contain 'classpath(\"com.bugsnag:bugsnag-android-gradle-plugin:'")
  step("the file '#{appGradle}' does not contain 'apply plugin: \"com.bugsnag.android.gradle\"'")
end

Then("the Bugsnag Android Gradle plugin is installed") do
  rootGradle = "android/build.gradle"
  appGradle = "android/app/build.gradle"

  step("the file '#{rootGradle}' contains 'classpath(\"com.bugsnag:bugsnag-android-gradle-plugin:'")
  step("the file '#{appGradle}' contains 'apply plugin: \"com.bugsnag.android.gradle\"'")
end

Then("bugsnag react-native is in the package.json file") do
  json = parse_package_json

  assert_includes(json, "dependencies")
  assert_includes(json["dependencies"], "@bugsnag/react-native")
end

Then("bugsnag react-native version {string} is in the package.json file") do |expected|
  json = parse_package_json

  assert_includes(json, "dependencies")
  assert_includes(json["dependencies"], "@bugsnag/react-native")
  assert_equal(json["dependencies"]["@bugsnag/react-native"], expected)
end

Then("bugsnag react-native is not in the package.json file") do
  json = parse_package_json

  assert_includes(json, "dependencies")
  refute_includes(json["dependencies"], "@bugsnag/react-native")
end

# TODO(PLAT-5566) migrate to Maze Runner (this step may need a bit more specific of a name)
Then("the file {string} contains {string}") do |filename, expected|
  steps %Q{
    When I input "fgrep '#{expected.gsub(/"/, '\"')}' #{filename}" interactively
    And I wait for the current stdout line to contain "/app #"
    Then the last interactive command exited successfully
  }
end

# TODO(PLAT-5566) migrate to Maze Runner (this step may need a bit more specific of a name)
# A version of the above that allows multi-line strings
Then("the file {string} contains") do |filename, expected|
  expected.each_line do |line|
    step("the file '#{filename}' contains '#{line.chomp}'")
  end
end

# TODO(PLAT-5566) migrate to Maze Runner (this step may need a bit more specific of a name)
Then("the file {string} does not contain {string}") do |filename, expected|
  steps %Q{
    When I input "fgrep '#{expected.gsub(/"/, '\"')}' #{filename}" interactively
    And I wait for the current stdout line to contain "/app #"
    Then the last interactive command exited with an error code
  }
end

# TODO(PLAT-5566) migrate to Maze Runner (this step may need a bit more specific of a name)
# A version of the above that allows multi-line strings
Then("the file {string} does not contain") do |filename, expected|
  expected.each_line do |line|
    step("the file '#{filename}' does not contain '#{line.chomp}'")
  end
end

Then("the iOS app contains the bugsnag initialisation code") do
  filename = "ios/#{current_fixture}/AppDelegate.m"

  step("the file '#{filename}' contains '#import <Bugsnag/Bugsnag.h>'")
  step("the file '#{filename}' contains '[Bugsnag start];'")
end

Then("the Android app contains the bugsnag initialisation code") do
  filename = "android/app/src/main/java/com/#{current_fixture}/MainApplication.java"

  step("the file '#{filename}' contains 'import com.bugsnag.android.Bugsnag;'")
  step("the file '#{filename}' contains 'Bugsnag.start(this);'")
end

Then("the iOS app does not contain the bugsnag initialisation code") do
  filename = "ios/#{current_fixture}/AppDelegate.m"

  step("the file '#{filename}' does not contain '#import <Bugsnag/Bugsnag.h>'")
  step("the file '#{filename}' does not contain '[Bugsnag start];'")
end

Then("the Android app does not contain the bugsnag initialisation code") do
  filename = "android/app/src/main/java/com/#{current_fixture}/MainApplication.java"

  step("the file '#{filename}' does not contain 'import com.bugsnag.android.Bugsnag;'")
  step("the file '#{filename}' does not contain 'Bugsnag.start(this);'")
end

Then("the JavaScript layer contains the bugsnag initialisation code") do
  steps %Q{
    Then the file 'index.js' contains
      """
      import Bugsnag from "@bugsnag/react-native";
      Bugsnag.start();
      """
  }
end

Then("the JavaScript layer does not contain the bugsnag initialisation code") do
  steps %Q{
    Then the file 'index.js' does not contain
      """
      import Bugsnag from "@bugsnag/react-native";
      Bugsnag.start();
      """
  }
end

Then("the modified files are as expected after running the insert command") do
  steps %Q{
    When I input "git status --porcelain" interactively
    Then I wait for the shell to output the following to stdout
      """
      M android/app/src/main/java/com/#{current_fixture}/MainApplication.java
      M index.js
      M ios/#{current_fixture}/AppDelegate.m
      """
  }
end

Then("the modified files are as expected after running the configure command") do
  steps %Q{
    When I input "git status --porcelain" interactively
    Then I wait for the shell to output the following to stdout
      """
      M android/app/src/main/AndroidManifest.xml
      M ios/#{current_fixture}/Info.plist
      """
  }
end

Then("there are no modified files in git") do
  uuid = SecureRandom.uuid

  steps %Q{
    When I input "git status --porcelain" interactively
    And I input "[ -z $(git status --porcelain) ] && echo '#{uuid} no changes' || echo '#{uuid} changes'" interactively
    Then I wait for the shell to output "#{uuid} no changes" to stdout
  }
end

def parse_xml_file(path)
  stdout_lines = Runner.interactive_session.stdout_lines
  length_before = stdout_lines.length
  uuid = SecureRandom.uuid

  steps %Q{
    When I input "cat #{path}" interactively
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

Then("the iOS app contains the bugsnag API key {string}") do |expected|
  xml = parse_xml_file("ios/#{current_fixture}/Info.plist")

  # This XPath does the following:
  #   1. find the '<key>' with the text 'bugsnag'
  #   2. find the following '<dict>' element
  #   3. within the dict, find any '<string>' elements
  # 'get_text' will then fetch the text content of the first element
  actual_api_key = xml.get_text('//key[text()="bugsnag"]/following-sibling::dict/string')

  assert_equal(expected, actual_api_key.to_s)
end

Then("the Android app contains the bugsnag API key {string}") do |expected|
  xml = parse_xml_file("android/app/src/main/AndroidManifest.xml")

  element = xml.get_elements('//meta-data[@android:name="com.bugsnag.android.API_KEY"]').first
  actual_api_key = element["android:value"]

  assert_equal(expected, actual_api_key.to_s)
end

Then("the iOS app does not contain a bugsnag API key") do
  xml = parse_xml_file("ios/#{current_fixture}/Info.plist")

  actual_api_key = xml.get_text('//key[text()="bugsnag"]/following-sibling::dict/string')

  assert_nil(actual_api_key)
end

Then("the Android app does not contain a bugsnag API key") do
  xml = parse_xml_file("android/app/src/main/AndroidManifest.xml")

  element = xml.get_elements('//meta-data[@android:name="com.bugsnag.android.API_KEY"]').first

  assert_nil(element)
end

Then("the iOS app contains the bugsnag notify URL {string}") do |expected|
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

  assert_equal(expected, actual.to_s)
end

Then("the Android app contains the bugsnag notify URL {string}") do |expected|
  xml = parse_xml_file("android/app/src/main/AndroidManifest.xml")

  element = xml.get_elements('//meta-data[@android:name="com.bugsnag.android.ENDPOINT_NOTIFY"]').first
  actual = element["android:value"]

  assert_equal(expected, actual.to_s)
end

Then("the iOS app does not contain a bugsnag notify URL") do
  xml = parse_xml_file("ios/#{current_fixture}/Info.plist")

  actual = xml.get_text('//key[text()="bugsnag"]/following-sibling::dict/key[text()="endpoints"]/following-sibling::dict/key[text()="notify"]/following-sibling::string[1]')

  assert_nil(actual)
end

Then("the Android app does not contain a bugsnag notify URL") do
  xml = parse_xml_file("android/app/src/main/AndroidManifest.xml")

  element = xml.get_elements('//meta-data[@android:name="com.bugsnag.android.ENDPOINT_NOTIFY"]').first

  assert_nil(element)
end

Then("the iOS app contains the bugsnag sessions URL {string}") do |expected|
  xml = parse_xml_file("ios/#{current_fixture}/Info.plist")

  actual = xml.get_text('//key[text()="bugsnag"]/following-sibling::dict/key[text()="endpoints"]/following-sibling::dict/key[text()="sessions"]/following-sibling::string[1]')

  assert_equal(expected, actual.to_s)
end

Then("the Android app contains the bugsnag sessions URL {string}") do |expected|
  xml = parse_xml_file("android/app/src/main/AndroidManifest.xml")

  element = xml.get_elements('//meta-data[@android:name="com.bugsnag.android.ENDPOINT_SESSIONS"]').first
  actual = element["android:value"]

  assert_equal(expected, actual.to_s)
end

Then("the iOS app does not contain a bugsnag sessions URL") do
  xml = parse_xml_file("ios/#{current_fixture}/Info.plist")

  actual = xml.get_text('//key[text()="bugsnag"]/following-sibling::dict/key[text()="endpoints"]/following-sibling::dict/key[text()="sessions"]/following-sibling::string[1]')

  assert_nil(actual)
end

Then("the Android app does not contain a bugsnag sessions URL") do
  xml = parse_xml_file("android/app/src/main/AndroidManifest.xml")

  element = xml.get_elements('//meta-data[@android:name="com.bugsnag.android.ENDPOINT_SESSIONS"]').first

  assert_nil(element)
end

Then('the request is valid for the build API') do
  request_body = Server.current_request[:body]
  assert_equal($api_key, read_key_path(request_body, 'apiKey'))
  assert_not_nil(read_key_path(request_body, 'appVersion'))
  assert_not_nil(read_key_path(request_body, 'builderName'))
  assert_not_nil(read_key_path(request_body, 'metadata.os_name'))
  assert_not_nil(read_key_path(request_body, 'metadata.os_arch'))
  assert_not_nil(read_key_path(request_body, 'metadata.os_version'))
  assert_not_nil(read_key_path(request_body, 'metadata.java_version'))
  assert_not_nil(read_key_path(request_body, 'metadata.gradle_version'))
  assert_not_nil(read_key_path(request_body, 'metadata.git_version'))
end

Then('the Content-Type header is valid multipart form-data') do
  expected = /^multipart\/form-data; boundary=--------------------------\d+$/
  actual = Server.current_request[:request]["content-type"]

  assert_match(expected, actual)
end
