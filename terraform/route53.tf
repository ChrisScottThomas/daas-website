resource "aws_route53_zone" "clarity" {
  name = "getclarity.win"
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.clarity.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = aws_route53_zone.clarity.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.record]
}

resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "getclarity.win"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "www.getclarity.win"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "dkim" {
  count   = 3
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "${aws_ses_domain_dkim.clarity.dkim_tokens[count.index]}._domainkey.getclarity.win"
  type    = "CNAME"
  ttl     = 300
  records = [
    "${aws_ses_domain_dkim.clarity.dkim_tokens[count.index]}.dkim.amazonses.com"
  ]
}

resource "aws_route53_record" "root_txt" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = aws_route53_zone.clarity.name
  type    = "TXT"
  ttl     = 300
  records = [
    "google-site-verification=3lFFbJbfvZLdQS1LKuxAYhF4kCMNGGyEMtNhkzysSfo",
    "MS=ms73991829",
    "v=spf1 include:spf.protection.outlook.com include:amazonses.com ~all"
  ]
  depends_on = [aws_route53_zone.clarity]
}

resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "_dmarc.getclarity.win"
  type    = "TXT"
  ttl     = 300
  records = [
    "v=DMARC1; p=none; rua=mailto:postmaster@getclarity.win"
  ]
}

resource "aws_route53_record" "mail_from_spf" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "mail.getclarity.win"
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com ~all"]
}

# resource "aws_route53_record" "gmail_mx" {
#   zone_id = aws_route53_zone.clarity.zone_id
#   name    = aws_route53_zone.clarity.name
#   type    = "MX"
#   ttl     = 300
#   records = [
#     "1 SMTP.GOOGLE.COM.",
#     "1 ASPMX.L.GOOGLE.COM.",
#     "5 ALT1.ASPMX.L.GOOGLE.COM.",
#     "5 ALT2.ASPMX.L.GOOGLE.COM.",
#     "10 ALT3.ASPMX.L.GOOGLE.COM.",
#     "10 ALT4.ASPMX.L.GOOGLE.COM."
#   ]
# }

resource "aws_route53_record" "mail_from_mx" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "mail.getclarity.win"
  type    = "MX"
  ttl     = 300
  records = [
    "10 feedback-smtp.eu-west-2.amazonses.com"
  ]
}

resource "aws_route53_record" "ses_verification" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "_amazonses.${aws_route53_zone.clarity.name}"
  type    = "TXT"
  ttl     = 300
  records = [aws_ses_domain_identity.clarity.verification_token]
}

resource "aws_route53_record" "google_dkim" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "google._domainkey.getclarity.win"
  type    = "TXT"
  ttl     = 300
  records = [
    "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsRh7KMmvzxH7WjY6xAcQEKkwhHqhR4Vhz1Lo0HynKA1EZPASVr",
    "GmjkcozUCyr9x8fmqhzlfPRDaQKSnWt/885KLQuQhJDTp7uYLZ+9V48D7JD/WXE+qOzemeNnkE12xoKuig7PlcVcjUvKG6C9a7L9Qugs57HJakPN4Z1ku3N9BKq5Q7/3ib0kvtvUC2uVAz9yaeIkk443dx/zKib",
    "lKYp8KElpq6LJsHqLf3CjduQ00vBx2vmXo14lIvRGU6UCOU2B/4C+DbX5HrqIzzXThMzigPoMorCfh2UIzDyosz9cDW+Dp/pHiI6ScET3qHB2Yiu6kfHhPFDvnRnokbwOqf+wIDAQAB"
  ]
}

resource "aws_route53_record" "m365_mx" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "getclarity.win"
  type    = "MX"
  ttl     = 300
  records = ["0 getclarity-win.mail.protection.outlook.com."]
}

resource "aws_route53_record" "m365_dkim1" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "selector1._domainkey"
  type    = "CNAME"
  ttl     = 300
  records = ["selector1-getclarity-win._domainkey.claritysupportservices.e-v1.dkim.mail.microsoft."]
}

resource "aws_route53_record" "m365_dkim2" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "selector2._domainkey"
  type    = "CNAME"
  ttl     = 300
  records = ["selector2-getclarity-win._domainkey.claritysupportservices.e-v1.dkim.mail.microsoft."]
}

resource "aws_route53_record" "autodiscover" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "autodiscover.getclarity.win"
  type    = "CNAME"
  ttl     = 300
  records = ["autodiscover.outlook.com"]
}

resource "aws_route53_record" "m365_srv" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "_sip._tls.getclarity.win"
  type    = "SRV"
  ttl     = 300
  records = ["100 1 443 sipdir.online.lync.com."]
}
