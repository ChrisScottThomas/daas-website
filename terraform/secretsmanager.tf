data "aws_secretsmanager_secret" "airtable_token" {
  name = "clarity-airtable-pat"
}

data "aws_secretsmanager_secret" "stripe_key" {
  name = "clarity-stripe-key"
}

data "aws_secretsmanager_secret_version" "stripe_key" {
  secret_id = "clarity-stripe-key"
}

data "aws_secretsmanager_secret" "token_secret" {
  name = "clarity-token-secret"
}

data "aws_secretsmanager_secret_version" "token_secret_version" {
  secret_id = data.aws_secretsmanager_secret.token_secret.id
}
