# features/support/lambda_config.rb
# Single source of truth for Lambda response array thresholds and exact trace lengths.
# Cucumber auto-loads everything in features/support/ before tests run.

module LambdaConfig
  FIELD_THRESHOLDS = {
    'trace' => 6,
    'body.stacktrace' => 11
  }.freeze

  TRACE_LENGTHS = {
    'AsyncUnhandledExceptionFunctionNode18' => 9,
    'CallbackUnhandledExceptionFunctionNode18' => 11,
    'CallbackThrownUnhandledExceptionFunctionNode18' => 11
  }.freeze

  def self.minimum_length_for(field)
    FIELD_THRESHOLDS.fetch(field, 1)
  end

  def self.trace_length_for(lambda_name)
    TRACE_LENGTHS.fetch(lambda_name)
  end
end