require 'webrick'

root = File.expand_path File.join(__dir__, '..', 'fixtures')
server = WEBrick::HTTPServer.new :Port => ENV['PORT'], :DocumentRoot => root
server.start
