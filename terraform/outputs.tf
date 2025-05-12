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

output "acm_dns_validation_record" {
  value = {
    name  = tolist(aws_acm_certificate.clarity.domain_validation_options)[0].resource_record_name
    type  = tolist(aws_acm_certificate.clarity.domain_validation_options)[0].resource_record_type
    value = tolist(aws_acm_certificate.clarity.domain_validation_options)[0].resource_record_value
  }

  description = "DNS CNAME record to add for ACM certificate validation"
}

output "acm_certificate_arn" {
  value = aws_acm_certificate.clarity.arn
}
