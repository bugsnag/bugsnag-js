# Tests whether the top-most payload is valid for the Bugsnag build API
# APIKey fields and headers are tested against the '$api_key' global variable
Then('the sourcemap is valid for the Build API') do
  steps %(
    And the sourcemap payload field "apiKey" equals "#{$api_key}"
    And the sourcemap payload field "appVersion" is not null
  )
end
