require 'webrick'

root = File.expand_path File.join(__dir__, '..', 'fixtures')
request_callback = Proc.new { |req, res|
  pp "INTERCEPTED REQUEST TO SERVER: #{req}"
  pp "BODY ---"
  pp req.body
  pp "BODY END ---"
}

server = WEBrick::HTTPServer.new :Port => ENV['PORT'], :DocumentRoot => root, :RequestCallback => request_callback
server.start
