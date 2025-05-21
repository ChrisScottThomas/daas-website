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

resource "aws_route53_record" "spf" {
  zone_id = aws_route53_zone.clarity.zone_id
  name    = "_spf.getclarity.win"
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com ~all"]
}
