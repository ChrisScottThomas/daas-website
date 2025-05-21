resource "aws_ses_domain_identity" "clarity" {
  domain = "getclarity.win"
}

resource "aws_ses_domain_dkim" "clarity" {
  domain = aws_ses_domain_identity.clarity.domain
}

output "ses_identity_arn" {
  value       = aws_ses_domain_identity.clarity.arn
  description = "ARN of the verified SES email identity"
}

resource "aws_ses_domain_mail_from" "clarity" {
  domain           = "getclarity.win"
  mail_from_domain = "mail.getclarity.win"

  behavior_on_mx_failure = "UseDefaultValue"
}
