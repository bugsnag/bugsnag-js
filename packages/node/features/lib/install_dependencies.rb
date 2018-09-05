unless ENV['MAZE_SKIP_INSTALL']
  Dir.chdir('features/fixtures') do
    # pack local packages so they can be loaded into the Docker images
    run_command('npm pack --verbose ../../')
    run_command('npm pack --verbose ../../../plugin-express')
    run_command('npm pack --verbose ../../../plugin-koa')
    run_command('npm pack --verbose ../../../plugin-restify')
  end

  Dir.chdir('features/fixtures') do
    run_command('./build.sh')
  end
else
  puts 'SKIPPING DEPENDENCY INSTALLATION'
end
