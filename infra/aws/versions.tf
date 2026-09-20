terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.primary_region

  default_tags {
    tags = {
      Application = "TAXPRAC"
      Company     = "RTPSC"
      Environment = "Production"
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "backup"
  region = var.backup_region

  default_tags {
    tags = {
      Application = "TAXPRAC"
      Company     = "RTPSC"
      Environment = "Production"
      ManagedBy   = "Terraform"
      Purpose     = "CrossRegionBackup"
    }
  }
}

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}
