resource "aws_dynamodb_table" "waitlist" {
  name         = "waitlist-emails"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "email"

  attribute {
    name = "email"
    type = "S"
  }
}
