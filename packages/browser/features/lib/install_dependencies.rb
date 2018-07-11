require 'json'
require_relative './fixture_package_jsons'
version = (JSON.parse open('package.json', &:read))['version']

unless ENV['MAZE_SKIP_INSTALL']
  run_command(
    # package up local bugsnag-js so it can be installed in the fixtures
    'npm pack --verbose'
  )

  # install node_modules
  Dir.chdir('features/fixtures') do
    run_command(
      "npm install --no-package-lock --no-save --verbose ../../bugsnag-browser-#{version}.tgz"
    )
  end

  get_package_jsons_for_fixtures.each do |pkg|
    Dir.chdir(File.dirname pkg) do
      run_command('npm install --no-package-lock --verbose')
    end
  end
else
  puts 'SKIPPING DEPENDENCY INSTALLATION'
end
