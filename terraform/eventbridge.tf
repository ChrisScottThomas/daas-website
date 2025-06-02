resource "aws_cloudwatch_event_rule" "waitlist_retry_rule" {
  name                = "waitlist-retry-rule"
  schedule_expression = "rate(5 minutes)" # Retry every 5 minutes
  description         = "Triggers the waitlist resend Lambda for failed emails"
}

resource "aws_cloudwatch_event_target" "waitlist_retry_target" {
  rule      = aws_cloudwatch_event_rule.waitlist_retry_rule.name
  target_id = "waitlistRetryLambda"
  arn       = aws_lambda_function.waitlist_retry.arn
}

resource "aws_lambda_permission" "allow_eventbridge_invoke_retry" {
  statement_id  = "AllowExecutionFromEventBridgeRetry"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.waitlist_retry.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.waitlist_retry_rule.arn
}
