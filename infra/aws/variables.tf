variable "primary_region" {
  type        = string
  description = "Primary TAXPRAC AWS region."
  default     = "us-east-1"
}

variable "backup_region" {
  type        = string
  description = "Geographically separate backup region."
  default     = "us-west-2"
}

variable "postgres_engine_version" {
  type        = string
  description = "Approved PostgreSQL major/minor version."
  default     = "17"
}

variable "db_instance_class" {
  type        = string
  description = "Production RDS instance class."
  default     = "db.m7g.large"
}

variable "alb_arn" {
  type        = string
  description = "Existing production ALB ARN to associate with TAXPRAC WAF. Leave empty until the application load balancer is provisioned."
  default     = ""
}

variable "admin_alert_email" {
  type        = string
  description = "Security alert mailbox. Subscription requires email confirmation."
  default     = ""
}

variable "blocked_country_codes" {
  type        = list(string)
  description = "ISO alpha-2 country codes to block. Empty by default to avoid accidental service denial."
  default     = []
}

variable "incident_remediation_enforcement" {
  type        = bool
  description = "Observe-only by default. Set true only after incident-response testing and approval."
  default     = false
}
