resource "aws_acm_certificate" "burendo_handbook" {
  provider          = aws.northvirginia
  domain_name       = "getclarity.win"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}
