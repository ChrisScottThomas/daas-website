resource "aws_api_gateway_rest_api" "waitlist_api" {
  name = "WaitlistAPI"
}

resource "aws_api_gateway_resource" "waitlist" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  parent_id   = aws_api_gateway_rest_api.waitlist_api.root_resource_id
  path_part   = "waitlist"
}

resource "aws_api_gateway_method" "waitlist_post" {
  rest_api_id   = aws_api_gateway_rest_api.waitlist_api.id
  resource_id   = aws_api_gateway_resource.waitlist.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id             = aws_api_gateway_rest_api.waitlist_api.id
  resource_id             = aws_api_gateway_resource.waitlist.id
  http_method             = aws_api_gateway_method.waitlist_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.waitlist.invoke_arn
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowInvokeWaitlistFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.waitlist.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.waitlist_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id

  depends_on = [
    aws_api_gateway_integration.lambda,

    aws_api_gateway_method.waitlist_post,

    aws_api_gateway_integration.invoice_lambda,
    aws_api_gateway_method.invoice_post,
    aws_api_gateway_method.invoice_options,
    aws_api_gateway_integration.invoice_options,
    aws_api_gateway_method_response.invoice_options,
    aws_api_gateway_integration_response.invoice_options,

    aws_api_gateway_integration.card_lambda,
    aws_api_gateway_method.card_post,
    aws_api_gateway_method.card_options,
    aws_api_gateway_integration.card_options,
    aws_api_gateway_method_response.card_options,
    aws_api_gateway_integration_response.card_options,

    aws_api_gateway_integration.stripe_checkout,
    aws_api_gateway_method.stripe_checkout_post,
    aws_api_gateway_method.stripe_checkout_options,
    aws_api_gateway_integration.stripe_checkout_options,
    aws_api_gateway_method_response.stripe_checkout_options_response,
    aws_api_gateway_integration_response.stripe_checkout_options_response,

    aws_api_gateway_integration.sign_token,
    aws_api_gateway_method.sign_token_post,
    aws_api_gateway_method.sign_token_options,
    aws_api_gateway_integration.sign_token_options,
    aws_api_gateway_method_response.sign_token_options,
    aws_api_gateway_integration_response.sign_token_options,

  ]

  triggers = {
    version = "redeploy-20250615-1"
  }

}

resource "aws_api_gateway_stage" "prod_stage" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.waitlist_api.id
  stage_name    = "prod"
  depends_on    = [aws_api_gateway_deployment.deployment]
}

resource "aws_api_gateway_resource" "invoice" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  parent_id   = aws_api_gateway_rest_api.waitlist_api.root_resource_id
  path_part   = "invoice-request"
}

resource "aws_api_gateway_method" "invoice_post" {
  rest_api_id   = aws_api_gateway_rest_api.waitlist_api.id
  resource_id   = aws_api_gateway_resource.invoice.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "invoice_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.waitlist_api.id
  resource_id             = aws_api_gateway_resource.invoice.id
  http_method             = aws_api_gateway_method.invoice_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.invoice_request.invoke_arn
}

resource "aws_lambda_permission" "invoice_apigw" {
  statement_id  = "AllowInvokeInvoiceFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.invoice_request.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.waitlist_api.execution_arn}/*/*"
}

resource "aws_api_gateway_method" "invoice_options" {
  rest_api_id   = aws_api_gateway_rest_api.waitlist_api.id
  resource_id   = aws_api_gateway_resource.invoice.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "invoice_options" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  resource_id = aws_api_gateway_resource.invoice.id
  http_method = aws_api_gateway_method.invoice_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "invoice_options" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  resource_id = aws_api_gateway_resource.invoice.id
  http_method = aws_api_gateway_method.invoice_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "invoice_options" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  resource_id = aws_api_gateway_resource.invoice.id
  http_method = aws_api_gateway_method.invoice_options.http_method
  status_code = "200"

  depends_on = [
    aws_api_gateway_integration.invoice_options
  ]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = ""
  }
}


resource "aws_api_gateway_resource" "card_payment" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  parent_id   = aws_api_gateway_rest_api.waitlist_api.root_resource_id
  path_part   = "card-payment"
}

resource "aws_api_gateway_method" "card_post" {
  rest_api_id   = aws_api_gateway_rest_api.waitlist_api.id
  resource_id   = aws_api_gateway_resource.card_payment.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "card_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.waitlist_api.id
  resource_id             = aws_api_gateway_resource.card_payment.id
  http_method             = aws_api_gateway_method.card_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.card_payment.invoke_arn
}

resource "aws_lambda_permission" "card_apigw" {
  statement_id  = "AllowCardInvokeFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.card_payment.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.waitlist_api.execution_arn}/*/*"
}

resource "aws_api_gateway_method" "card_options" {
  rest_api_id   = aws_api_gateway_rest_api.waitlist_api.id
  resource_id   = aws_api_gateway_resource.card_payment.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "card_options" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  resource_id = aws_api_gateway_resource.card_payment.id
  http_method = aws_api_gateway_method.card_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "card_options" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  resource_id = aws_api_gateway_resource.card_payment.id
  http_method = aws_api_gateway_method.card_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "card_options" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  resource_id = aws_api_gateway_resource.card_payment.id
  http_method = aws_api_gateway_method.card_options.http_method
  status_code = "200"

  depends_on = [
    aws_api_gateway_integration.card_options
  ]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = ""
  }
}

resource "aws_api_gateway_resource" "stripe_checkout" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  parent_id   = aws_api_gateway_rest_api.waitlist_api.root_resource_id
  path_part   = "stripe-checkout"
}

resource "aws_api_gateway_method" "stripe_checkout_post" {
  rest_api_id   = aws_api_gateway_rest_api.waitlist_api.id
  resource_id   = aws_api_gateway_resource.stripe_checkout.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "stripe_checkout" {
  rest_api_id             = aws_api_gateway_rest_api.waitlist_api.id
  resource_id             = aws_api_gateway_resource.stripe_checkout.id
  http_method             = aws_api_gateway_method.stripe_checkout_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.stripe_checkout.invoke_arn
}

resource "aws_lambda_permission" "stripe_checkout_apigw" {
  statement_id  = "AllowAPIGatewayInvokeStripeCheckout"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stripe_checkout.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.waitlist_api.execution_arn}/*/*"
}

resource "aws_api_gateway_method" "stripe_checkout_options" {
  rest_api_id   = aws_api_gateway_rest_api.waitlist_api.id
  resource_id   = aws_api_gateway_resource.stripe_checkout.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "stripe_checkout_options" {
  rest_api_id             = aws_api_gateway_rest_api.waitlist_api.id
  resource_id             = aws_api_gateway_resource.stripe_checkout.id
  http_method             = aws_api_gateway_method.stripe_checkout_options.http_method
  type                    = "MOCK"
  integration_http_method = "OPTIONS"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "stripe_checkout_options_response" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  resource_id = aws_api_gateway_resource.stripe_checkout.id
  http_method = aws_api_gateway_method.stripe_checkout_options.http_method
  status_code = "200"

  depends_on = [
    aws_api_gateway_method.stripe_checkout_options
  ]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}


resource "aws_api_gateway_integration_response" "stripe_checkout_options_response" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  resource_id = aws_api_gateway_resource.stripe_checkout.id
  http_method = aws_api_gateway_method.stripe_checkout_options.http_method
  status_code = "200"

  depends_on = [
    aws_api_gateway_integration.stripe_checkout_options,
    aws_api_gateway_method_response.stripe_checkout_options_response
  ]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = ""
  }
}

resource "aws_api_gateway_resource" "sign_token" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  parent_id   = aws_api_gateway_rest_api.waitlist_api.root_resource_id
  path_part   = "sign-token"
}

resource "aws_api_gateway_method" "sign_token_post" {
  rest_api_id   = aws_api_gateway_rest_api.waitlist_api.id
  resource_id   = aws_api_gateway_resource.sign_token.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "sign_token" {
  rest_api_id             = aws_api_gateway_rest_api.waitlist_api.id
  resource_id             = aws_api_gateway_resource.sign_token.id
  http_method             = aws_api_gateway_method.sign_token_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.sign_token.invoke_arn
}

resource "aws_lambda_permission" "allow_api_gateway_sign_token" {
  statement_id  = "AllowExecutionFromAPIGatewaySignToken"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sign_token.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.waitlist_api.execution_arn}/*/*"
}

resource "aws_api_gateway_method" "sign_token_options" {
  rest_api_id   = aws_api_gateway_rest_api.waitlist_api.id
  resource_id   = aws_api_gateway_resource.sign_token.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "sign_token_options" {
  rest_api_id             = aws_api_gateway_rest_api.waitlist_api.id
  resource_id             = aws_api_gateway_resource.sign_token.id
  http_method             = aws_api_gateway_method.sign_token_options.http_method
  type                    = "MOCK"
  integration_http_method = "OPTIONS"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "sign_token_options" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  resource_id = aws_api_gateway_resource.sign_token.id
  http_method = "OPTIONS"
  status_code = "200"

  depends_on = [
    aws_api_gateway_method.sign_token_options
  ]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Headers" = true
  }
}

resource "aws_api_gateway_integration_response" "sign_token_options" {
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
  resource_id = aws_api_gateway_resource.sign_token.id
  http_method = "OPTIONS"
  status_code = "200"

  depends_on = [
    aws_api_gateway_integration.sign_token_options,
    aws_api_gateway_method_response.sign_token_options_response
  ]

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'",
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'",
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type'"
  }

  response_templates = {
    "application/json" = ""
  }
}
