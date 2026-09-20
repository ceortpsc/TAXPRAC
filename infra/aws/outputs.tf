output "database_endpoint" {
  description = "Private RDS endpoint. Do not expose it directly to the public internet."
  value       = aws_db_instance.taxprac.address
  sensitive   = true
}

output "static_resource_bucket" {
  value = aws_s3_bucket.static_resources.bucket
}

output "backup_vault_primary" {
  value = aws_backup_vault.primary.name
}

output "backup_vault_secondary" {
  value = aws_backup_vault.secondary.name
}

output "immutable_backup_evidence_bucket" {
  value = aws_s3_bucket.immutable_backup_evidence.bucket
}

output "waf_web_acl_arn" {
  value = aws_wafv2_web_acl.taxprac.arn
}

output "guardduty_detector_id" {
  value = aws_guardduty_detector.taxprac.id
}

output "github_actions_role_arn" {
  description = "OIDC role trust exists without a broad permission policy. Attach reviewed least-privilege permissions before production apply."
  value       = aws_iam_role.github_actions.arn
}

output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}
