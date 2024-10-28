source 'https://rubygems.org'

gem 'cocoapods', '~> 1.14.3'
gem 'xcodeproj', '1.25.1'

# Only install bumpsnag if we're using Github actions
unless ENV['GITHUB_ACTIONS'].nil?
  gem 'bumpsnag', git: 'https://github.com/bugsnag/platforms-bumpsnag', branch: 'main'
end
