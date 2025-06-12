terraform {
  required_version = "1.12.0"


  backend "s3" {
    bucket       = "daas-site-state"
    key          = "terraform/daas/daas-site-state.tfstate"
    region       = "eu-west-2"
    encrypt      = true
    use_lockfile = "terraform-locks"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.97.0"
    }
  }
}

provider "aws" {
  region = "eu-west-2"

}

provider "aws" {
  # Required to be in N Virgina as Cloudfront doesn't use a certificate from a different region for SSL
  alias  = "northvirginia"
  region = "us-east-1"
}
