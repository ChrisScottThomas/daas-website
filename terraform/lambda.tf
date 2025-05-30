resource "aws_lambda_function" "waitlist" {
  function_name    = "waitlistHandler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")

  environment {
    variables = {
      TABLE_NAME          = aws_dynamodb_table.waitlist.name
      SENDER_EMAIL        = "hello@getclarity.win"
      AIRTABLE_TOKEN      = data.aws_secretsmanager_secret.airtable_token.arn
      AIRTABLE_BASE_ID    = "appK1h4aAzYAGEjTB"
      AIRTABLE_TABLE_NAME = "Signups"
    }
  }

}
