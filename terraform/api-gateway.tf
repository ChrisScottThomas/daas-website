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
  statement_id  = "AllowInvokeFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.waitlist.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.waitlist_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on  = [aws_api_gateway_integration.lambda]
  rest_api_id = aws_api_gateway_rest_api.waitlist_api.id
}

resource "aws_api_gateway_stage" "prod_stage" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.waitlist_api.id
  stage_name    = "prod"
}
