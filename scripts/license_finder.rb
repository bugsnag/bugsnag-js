# Get each package, including the parent
paths = ['./package.json']
paths += Dir.glob('packages/*/package.json')

# Check licenses for all dependencies, based on decisions file.
all_ok = true
paths.each do |path|
  dir = path.delete_suffix('/package.json')
  cmd = "license_finder --decisions-file=config/decisions.yml --enabled-package-managers=npm --project-path=#{dir}"
  puts "Running: #{cmd}"
  output = `#{cmd}`
  success = $? == 0
  all_ok = false unless success

  puts output
  puts "Success: #{success}\n"
  puts "--------------\n"
end

raise 'License check failed' unless all_ok
