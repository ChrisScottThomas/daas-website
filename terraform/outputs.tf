output "cloudfront_url" {
  value = aws_cloudfront_distribution.cdn.domain_name
}

output "api_endpoint" {
  description = "Public POST endpoint for waitlist signup"
  value       = "https://${aws_api_gateway_rest_api.waitlist_api.id}.execute-api.eu-west-2.amazonaws.com/${aws_api_gateway_stage.prod_stage.stage_name}/waitlist"
}

output "invoice_api_endpoint" {
  description = "Public POST endpoint for invoice requests"
  value       = "https://${aws_api_gateway_rest_api.waitlist_api.id}.execute-api.eu-west-2.amazonaws.com/${aws_api_gateway_stage.prod_stage.stage_name}/invoice-request"
}

output "card_api_endpoint" {
  description = "Public POST endpoint for card payments"
  value       = "https://${aws_api_gateway_rest_api.waitlist_api.id}.execute-api.eu-west-2.amazonaws.com/${aws_api_gateway_stage.prod_stage.stage_name}/card-payment"
}

output "checkout_api_endpoint" {
  description = "Public POST endpoint for stripe checkout"
  value       = "https://${aws_api_gateway_rest_api.waitlist_api.id}.execute-api.eu-west-2.amazonaws.com/${aws_api_gateway_stage.prod_stage.stage_name}/stripe-checkout"
}

output "sign_token_api_endpoint" {
  description = "Public POST endpoint for token signing"
  value       = "https://${aws_api_gateway_rest_api.waitlist_api.id}.execute-api.eu-west-2.amazonaws.com/${aws_api_gateway_stage.prod_stage.stage_name}/sign-token"
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

output "route53_nameservers" {
  value = aws_route53_zone.clarity.name_servers
}
