resource "aws_kms_key" "primary" {
  description             = "TAXPRAC production data encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "primary" {
  name          = "alias/taxprac-production"
  target_key_id = aws_kms_key.primary.key_id
}

resource "aws_vpc" "taxprac" {
  cidr_block           = "10.42.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.taxprac.id
  cidr_block        = "10.42.10.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "taxprac-private-a"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.taxprac.id
  cidr_block        = "10.42.20.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "taxprac-private-b"
  }
}

resource "aws_security_group" "application" {
  name        = "taxprac-application"
  description = "Application-tier identity for database access"
  vpc_id      = aws_vpc.taxprac.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "database" {
  name        = "taxprac-database"
  description = "Private PostgreSQL access only from TAXPRAC application tier"
  vpc_id      = aws_vpc.taxprac.id

  ingress {
    description     = "PostgreSQL from TAXPRAC application security group"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.application.id]
  }
}

resource "aws_db_subnet_group" "taxprac" {
  name       = "taxprac-production"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

resource "aws_db_parameter_group" "taxprac" {
  name   = "taxprac-postgres17"
  family = "postgres17"

  parameter {
    name         = "shared_preload_libraries"
    value        = "pg_stat_statements"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "autovacuum_vacuum_scale_factor"
    value = "0.05"
  }

  parameter {
    name  = "autovacuum_analyze_scale_factor"
    value = "0.05"
  }

  parameter {
    name  = "autovacuum_vacuum_cost_limit"
    value = "3000"
  }

  parameter {
    name  = "autovacuum_vacuum_cost_delay"
    value = "2"
  }
}

resource "aws_db_instance" "taxprac" {
  identifier = "taxprac-production"

  engine         = "postgres"
  engine_version = var.postgres_engine_version
  instance_class = var.db_instance_class

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.primary.arn

  db_name  = "taxprac"
  username = "taxprac_admin"

  manage_master_user_password   = true
  iam_database_authentication_enabled = true

  db_subnet_group_name   = aws_db_subnet_group.taxprac.name
  vpc_security_group_ids = [aws_security_group.database.id]
  parameter_group_name   = aws_db_parameter_group.taxprac.name

  publicly_accessible    = false
  multi_az               = true
  deletion_protection    = true
  auto_minor_version_upgrade = true
  apply_immediately      = false

  backup_retention_period = 35
  copy_tags_to_snapshot   = true
  skip_final_snapshot     = false
  final_snapshot_identifier = "taxprac-production-final"

  performance_insights_enabled          = true
  performance_insights_kms_key_id       = aws_kms_key.primary.arn
  performance_insights_retention_period = 31

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
}

resource "aws_s3_bucket" "static_resources" {
  bucket_prefix = "taxprac-prod-static-"
}

resource "aws_s3_bucket_public_access_block" "static_resources" {
  bucket = aws_s3_bucket.static_resources.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "static_resources" {
  bucket = aws_s3_bucket.static_resources.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static_resources" {
  bucket = aws_s3_bucket.static_resources.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.primary.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_ecr_repository" "api" {
  name                 = "taxprac-api"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key          = aws_kms_key.primary.arn
  }
}
