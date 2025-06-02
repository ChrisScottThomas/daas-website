resource "aws_lambda_function" "waitlist" {
  function_name    = "waitlistHandler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  filename         = "../waitlist-lambda.zip"
  source_code_hash = filebase64sha256("../waitlist-lambda.zip")

  environment {
    variables = {
      TABLE_NAME          = aws_dynamodb_table.waitlist.name
      SENDER_EMAIL        = "hello@getclarity.win"
      AIRTABLE_SECRET_ARN = data.aws_secretsmanager_secret.airtable_token.arn
      AIRTABLE_BASE_ID    = "appK1h4aAzYAGEjTB"
      AIRTABLE_TABLE_NAME = "Signups"
    }
  }
  tags = {
    Project = "Clarity"
    Purpose = "WaitlistEmails"
  }


}

resource "aws_lambda_function" "waitlist_retry" {
  function_name = "waitlistRetryHandler"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "retry.handler"
  runtime       = "nodejs18.x"

  filename         = "../lambda/retry-lambda.zip"
  source_code_hash = filebase64sha256("../retry-lambda.zip")

  environment {
    variables = {
      TABLE_NAME          = aws_dynamodb_table.waitlist.name
      SENDER_EMAIL        = "hello@getclarity.win"
      AIRTABLE_SECRET_ARN = data.aws_secretsmanager_secret.airtable_token.arn
      AIRTABLE_BASE_ID    = "appK1h4aAzYAGEjTB"
      AIRTABLE_TABLE_NAME = "Signups"
    }
  }

  tags = {
    Project = "Clarity"
    Purpose = "RetryFailedEmails"
  }
}
