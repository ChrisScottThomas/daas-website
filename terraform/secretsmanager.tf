data "aws_secretsmanager_secret" "airtable_token" {
  name = "clarity-airtable-pat"
}

data "aws_secretsmanager_secret" "stripe_key" {
  name = "clarity-stripe-key"
}
