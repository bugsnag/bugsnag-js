require 'json'
require_relative './fixture_package_jsons'
version = (JSON.parse open('package.json', &:read))['version']

unless ENV['MAZE_SKIP_INSTALL']
  run_command('rm -fr bugsnag-browser*.tgz')

  # package up local @bugsnag/js so it can be installed in the fixtures
  run_command('npm pack --verbose')

  Dir.chdir('../js') do
    run_command('npm pack --verbose')
  end

  Dir.chdir('../node') do
    run_command('npm pack --verbose')
  end

  # package up frontend plugins

  Dir.chdir('../plugin-react') do
    run_command('npm pack --verbose')
  end

  Dir.chdir('../plugin-vue') do
    run_command('npm pack --verbose')
  end

  Dir.chdir('../plugin-angular') do
    run_command('npm pack --verbose')
  end

  # install node_modules
  Dir.chdir('features/fixtures') do
    run_command(
      "npm install --no-package-lock --no-save --verbose ../../bugsnag-browser-*.tgz"
    )
    run_command(
      "npm install --no-package-lock --no-save --verbose ../../../plugin-react/bugsnag-plugin-react-*.tgz"
    )
    run_command(
      "npm install --no-package-lock --no-save --verbose ../../../plugin-vue/bugsnag-plugin-vue-*.tgz"
    )
  end

  Dir.chdir('features/fixtures/plugin_angular/ng') do
    run_command(
      "npm install --no-package-lock --no-save --verbose ../../../../../plugin-angular/bugsnag-plugin-angular-*.tgz  ../../../../../node/bugsnag-node-#{version}.tgz  ../../../../../browser/bugsnag-browser-#{version}.tgz ../../../../../js/bugsnag-js-#{version}.tgz"
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
