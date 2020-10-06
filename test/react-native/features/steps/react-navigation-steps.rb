When("I trigger a handled error") do
  steps %Q{
    Given the element "sendHandled" is present within 60 seconds
    And I click the element "sendHandled"
  }
end

When("I trigger an unhandled error") do
  steps %Q{
    Given the element "sendUnhandled" is present within 60 seconds
    And I click the element "sendUnhandled"
  }
end

When("I navigate to a different screen") do
  steps %Q{
    Given the element "navigate" is present within 30 seconds
    And I click the element "navigate"
  }
end

When("I set a client context") do
  steps %Q{
    Given the element "setContext" is present within 30 seconds
    And I click the element "setContext"
  }
end