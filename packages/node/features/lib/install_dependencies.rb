unless ENV['MAZE_SKIP_INSTALL']
  Dir.chdir('features/fixtures') do
    run_command(
      # package up local @bugsnag/node so it can be loaded into the Docker images
      'npm pack --verbose ../../'
    )
    run_command(
      # package up local @bugsnag/plugin-express so it can be loaded into the Docker images
      'npm pack --verbose ../../../plugin-express'
    )
    run_command('npm pack --verbose ../../../plugin-restify')
  end

  Dir.chdir('features/fixtures') do
    run_command('./build.sh')
  end
else
  puts 'SKIPPING DEPENDENCY INSTALLATION'
end
