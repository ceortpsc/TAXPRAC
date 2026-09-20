resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-taxprac-production"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.primary.arn
}

resource "aws_wafv2_web_acl" "taxprac" {
  name  = "taxprac-production"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "taxprac-common"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 20

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "taxprac-sqli"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 30

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "taxprac-known-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimit"
    priority = 40

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "taxprac-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  dynamic "rule" {
    for_each = length(var.blocked_country_codes) > 0 ? [1] : []

    content {
      name     = "GeoBlock"
      priority = 50

      action {
        block {}
      }

      statement {
        geo_match_statement {
          country_codes = var.blocked_country_codes
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "taxprac-geo-block"
        sampled_requests_enabled   = true
      }
    }
  }

  rule {
    name     = "SuspiciousAgentAndPathObserve"
    priority = 60

    action {
      count {}
    }

    statement {
      and_statement {
        statement {
          byte_match_statement {
            field_to_match {
              single_header {
                name = "user-agent"
              }
            }

            positional_constraint = "CONTAINS"
            search_string         = "scanner"

            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }

        statement {
          byte_match_statement {
            field_to_match {
              uri_path {}
            }

            positional_constraint = "STARTS_WITH"
            search_string         = "/admin"

            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "taxprac-custom-observe"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "taxprac-production"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_logging_configuration" "taxprac" {
  resource_arn            = aws_wafv2_web_acl.taxprac.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]
}

resource "aws_wafv2_web_acl_association" "taxprac" {
  count        = var.alb_arn == "" ? 0 : 1
  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.taxprac.arn
}
