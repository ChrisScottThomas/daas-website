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

# Optional: Custom Mail From Domain (for branding and deliverability)
# Uncomment if you want to manage MAIL FROM domain later
# resource "aws_ses_domain_mail_from" "clarity" {
#   domain           = "getclarity.win"
#   mail_from_domain = "mail.getclarity.win"
# 
#   behavior_on_mx_failure = "UseDefaultValue"
# }

# You’ll still need to confirm the identity manually via the AWS Console (click verification link)
# Alternatively, you can automate this using Route53 if DNS is hosted in AWS
