# TAXPRAC AWS Production Blueprint

This directory is a reviewed Infrastructure-as-Code blueprint for the AWS-specific controls requested for TAXPRAC. It is not evidence that AWS resources exist until a Terraform plan and apply succeed in an authorized AWS account.

## Implemented in Terraform

- Private, Multi-AZ PostgreSQL RDS with public access disabled.
- Customer-managed KMS encryption with key rotation.
- RDS Performance Insights and PostgreSQL/upgrade log export.
- pg_stat_statements preload plus aggressive autovacuum defaults.
- Indexed office/status access paths.
- S3 static-resource bucket with KMS encryption, versioning, and public-access blocking.
- Daily AWS Backup plan with 30-day retention and cross-region copy.
- Secondary backup vault lock and 30-day S3 Object Lock in COMPLIANCE mode for backup evidence.
- AWS WAF Common, SQLi, and Known Bad Inputs managed rule groups.
- IP rate limiting and optional country blocks.
- Custom WAF rule in COUNT mode for observation before blocking.
- WAF logs to CloudWatch.
- GuardDuty, EventBridge, SNS, CloudTrail, and Access Analyzer.
- Incident-response Lambda defaults to observe and can disable a compromised IAM access key only after enforcement is explicitly enabled.
- GitHub Actions OIDC trust restricted to ceortpsc/TAXPRAC on main.
- Immutable ECR image tags and scan-on-push.

## Deliberately not automated

- No RDS/EC2/VPC black-hole quarantine.
- No automatic application-user MFA claim.
- No arbitrary geographic block list.
- No broad AdministratorAccess policy for GitHub Actions.
- No AWS apply without a connected AWS account and reviewed role policy.

## Required before apply

1. Connect the target AWS account using an authorized deployment identity.
2. Review regions, data residency, and backup-region selection.
3. Review the RDS engine version and instance sizing.
4. Attach a least-privilege permission policy to the generated GitHub OIDC role.
5. Configure the GitHub production environment and AWS_ROLE_ARN / AWS_PRIMARY_REGION variables.
6. Confirm all active TAXPRAC practitioners are enrolled in an approved MFA-capable identity provider before enforcing MFA globally.
7. Run terraform plan, review every change, then use the gated production workflow with DEPLOY.

Application-level Owner/Admin/Practitioner/Staff RBAC is separate from AWS IAM. Tax preparers should not receive AWS infrastructure permissions merely because they use TAXPRAC.
