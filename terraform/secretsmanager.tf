data "aws_secretsmanager_secret" "airtable_token" {
  name = "clarity-airtable-pat"
}
