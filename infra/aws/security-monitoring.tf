data "archive_file" "guardduty_remediator" {
  type        = "zip"
  source_file = "${path.module}/lambda/guardduty_remediator.py"
  output_path = "${path.module}/guardduty_remediator.zip"
}

resource "aws_guardduty_detector" "taxprac" {
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"
}

resource "aws_sns_topic" "security_alerts" {
  name              = "taxprac-security-alerts"
  kms_master_key_id = aws_kms_key.primary.arn
}

resource "aws_sns_topic_subscription" "security_email" {
  count     = var.admin_alert_email == "" ? 0 : 1
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.admin_alert_email
}

resource "aws_iam_role" "guardduty_remediator" {
  name = "taxprac-guardduty-remediator"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "guardduty_remediator" {
  name = "taxprac-guardduty-remediator"
  role = aws_iam_role.guardduty_remediator.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = ["iam:UpdateAccessKey"]
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/*"
      }
    ]
  })
}

resource "aws_lambda_function" "guardduty_remediator" {
  function_name = "taxprac-guardduty-remediator"
  role          = aws_iam_role.guardduty_remediator.arn
  handler       = "guardduty_remediator.lambda_handler"
  runtime       = "python3.13"
  timeout       = 30

  filename         = data.archive_file.guardduty_remediator.output_path
  source_code_hash = data.archive_file.guardduty_remediator.output_base64sha256

  environment {
    variables = {
      ENFORCEMENT_MODE = var.incident_remediation_enforcement ? "enforce" : "observe"
    }
  }
}

resource "aws_cloudwatch_event_rule" "guardduty_high" {
  name = "taxprac-guardduty-high-severity"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [{ numeric = [">=", 7] }]
    }
  })
}

resource "aws_cloudwatch_event_target" "guardduty_sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_high.name
  target_id = "security-alerts"
  arn       = aws_sns_topic.security_alerts.arn
}

resource "aws_cloudwatch_event_target" "guardduty_lambda" {
  rule      = aws_cloudwatch_event_rule.guardduty_high.name
  target_id = "observe-remediation"
  arn       = aws_lambda_function.guardduty_remediator.arn
}

resource "aws_lambda_permission" "guardduty_eventbridge" {
  statement_id  = "AllowEventBridgeGuardDuty"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.guardduty_remediator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.guardduty_high.arn
}

resource "aws_sns_topic_policy" "security_alerts" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
      Action   = "sns:Publish"
      Resource = aws_sns_topic.security_alerts.arn
    }]
  })
}

resource "aws_s3_bucket" "cloudtrail" {
  bucket_prefix = "taxprac-cloudtrail-"
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  versioning_configuration {
    status = "Enabled"
  }
}

data "aws_iam_policy_document" "cloudtrail_bucket" {
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.cloudtrail.arn]
  }

  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    actions = ["s3:PutObject"]
    resources = [
      "${aws_s3_bucket.cloudtrail.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket.json
}

resource "aws_cloudtrail" "taxprac" {
  name                          = "taxprac-production"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  depends_on = [aws_s3_bucket_policy.cloudtrail]
}

resource "aws_accessanalyzer_analyzer" "account" {
  analyzer_name = "taxprac-account-access"
  type          = "ACCOUNT"
}
