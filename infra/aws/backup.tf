resource "aws_kms_key" "backup" {
  provider                = aws.backup
  description             = "TAXPRAC cross-region backup encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_backup_vault" "primary" {
  name        = "taxprac-production-primary"
  kms_key_arn = aws_kms_key.primary.arn
}

resource "aws_backup_vault" "secondary" {
  provider    = aws.backup
  name        = "taxprac-production-secondary"
  kms_key_arn = aws_kms_key.backup.arn
}

resource "aws_backup_vault_lock_configuration" "secondary" {
  provider              = aws.backup
  backup_vault_name     = aws_backup_vault.secondary.name
  min_retention_days    = 30
  max_retention_days    = 365
  changeable_for_days   = 3
}

resource "aws_backup_plan" "taxprac" {
  name = "taxprac-daily-30-day"

  rule {
    rule_name         = "taxprac-nightly"
    target_vault_name = aws_backup_vault.primary.name
    schedule          = "cron(0 7 * * ? *)"

    lifecycle {
      delete_after = 30
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.secondary.arn

      lifecycle {
        delete_after = 30
      }
    }
  }
}

resource "aws_iam_role" "backup" {
  name = "taxprac-aws-backup"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "backup.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_backup_selection" "taxprac" {
  iam_role_arn = aws_iam_role.backup.arn
  name         = "taxprac-rds"
  plan_id      = aws_backup_plan.taxprac.id
  resources    = [aws_db_instance.taxprac.arn]
}

resource "aws_s3_bucket" "immutable_backup_evidence" {
  provider            = aws.backup
  bucket_prefix       = "taxprac-backup-evidence-"
  object_lock_enabled = true
}

resource "aws_s3_bucket_versioning" "immutable_backup_evidence" {
  provider = aws.backup
  bucket   = aws_s3_bucket.immutable_backup_evidence.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "immutable_backup_evidence" {
  provider = aws.backup
  bucket   = aws_s3_bucket.immutable_backup_evidence.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.backup.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_object_lock_configuration" "immutable_backup_evidence" {
  provider = aws.backup
  bucket   = aws_s3_bucket.immutable_backup_evidence.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = 30
    }
  }
}
