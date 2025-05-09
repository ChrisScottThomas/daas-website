resource "aws_lambda_function" "waitlist" {
  function_name = "waitlistHandler"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  filename      = "../lambda.zip"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.waitlist.name
    }
  }
}
