output "cloudfront_url" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "api_endpoint" {
  value = "${aws_api_gateway_deployment.deployment.invoke_url}/waitlist"
}
