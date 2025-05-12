resource "aws_acm_certificate" "clarity" {
  provider                  = aws.northvirginia
  domain_name               = "getclarity.win"
  validation_method         = "DNS"
  subject_alternative_names = ["www.getclarity.win"]

  lifecycle {
    create_before_destroy = true
  }
}
