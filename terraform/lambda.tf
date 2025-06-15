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

  filename         = "../retry-lambda.zip"
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

resource "aws_lambda_function" "invoice_request" {
  function_name    = "invoiceRequestHandler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.handler"
  runtime          = "nodejs18.x"
  filename         = "../invoice-lambda.zip"
  source_code_hash = filebase64sha256("../invoice-lambda.zip")

  environment {
    variables = {
      AIRTABLE_SECRET_ARN = data.aws_secretsmanager_secret.airtable_token.arn
      AIRTABLE_BASE_ID    = "appyAQqBEfEwyFKlH"
      AIRTABLE_TABLE_NAME = "Invoices"
      SENDER_EMAIL        = "hello@getclarity.win"
    }
  }

  tags = {
    Project = "Clarity"
    Purpose = "InvoiceRequests"
  }
}

resource "aws_lambda_function" "card_payment" {
  function_name    = "cardPaymentHandler"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  filename         = "../card-lambda.zip"
  source_code_hash = filebase64sha256("../card-lambda.zip")

  environment {
    variables = {
      STRIPE_SECRET_KEY = data.aws_secretsmanager_secret.stripe_key.arn
      SITE_URL          = "https://getclarity.win"
    }
  }

  tags = {
    Project = "Clarity"
    Purpose = "CardPayment"
  }
}

resource "aws_lambda_function" "stripe_checkout" {
  function_name    = "stripe-checkout"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  filename         = "../stripe-checkout-lambda.zip"
  source_code_hash = filebase64sha256("../stripe-checkout-lambda.zip")

  environment {
    variables = {
      STRIPE_SECRET_KEY = data.aws_secretsmanager_secret_version.stripe_key.secret_string
      SITE_URL          = "https://getclarity.win"
    }
  }

  tags = {
    Project = "Clarity"
    Purpose = "Checkout"
  }
}

resource "aws_lambda_function" "sign_token" {
  function_name    = "sign-token"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  filename         = "../sign-token-lambda.zip"
  source_code_hash = filebase64sha256("../sign-token-lambda.zip")

  environment {
    variables = {
      TOKEN_SECRET = data.aws_secretsmanager_secret_version.token_secret_version.secret_string
      SITE_URL     = "https://getclarity.win"
    }
  }

  tags = {
    Project = "Clarity"
    Purpose = "Signs session token"
  }
}

resource "aws_lambda_function" "select_plan_lambda" {
  function_name    = "select-plan"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  filename         = "../select-plan-lambda.zip"
  source_code_hash = filebase64sha256("../select-plan-lambda.zip")

  environment {
    variables = {
      TOKEN_SECRET = data.aws_secretsmanager_secret_version.token_secret_version.secret_string
    }
  }

  tags = {
    Project = "Clarity"
    Purpose = "Token-based plan resolver"
  }
}
