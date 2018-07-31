unless ENV['MAZE_SKIP_INSTALL']
  Dir.chdir('features/fixtures') do
    run_command(
      # package up local @bugsnag/node so it can be loaded into the Docker images
      'npm pack --verbose ../../'
    )
  end

  Dir.chdir('features/fixtures') do
    run_command('./build.sh')
  end
else
  puts 'SKIPPING DEPENDENCY INSTALLATION'
end
