terraform {
  required_version = "1.2.6"


  # backend "s3" {
  #   bucket         = "daas-site-state"
  #   key            = "terraform/daas/daas-site-state.tfstate"
  #   region         = "eu-west-2"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-west-2"

}
