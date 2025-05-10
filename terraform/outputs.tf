output "cloudfront_url" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "api_endpoint" {
  value = "${aws_api_gateway_deployment.deployment.invoke_url}/waitlist"
}

output "s3_endpoint" {
  value = aws_s3_bucket_website_configuration.site.website_endpoint
}

output "bucket_name" {
  value = var.bucket_name
}
