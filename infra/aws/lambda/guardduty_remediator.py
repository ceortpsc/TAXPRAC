import json
import os

import boto3


iam = boto3.client("iam")
ENFORCEMENT_MODE = os.getenv("ENFORCEMENT_MODE", "observe").lower()


def lambda_handler(event, context):
    detail = event.get("detail", {})
    finding_type = detail.get("type", "unknown")
    severity = detail.get("severity", 0)
    resource = detail.get("resource", {})
    access_key = resource.get("accessKeyDetails", {})
    access_key_id = access_key.get("accessKeyId")
    user_name = access_key.get("userName")

    result = {
        "finding_type": finding_type,
        "severity": severity,
        "mode": ENFORCEMENT_MODE,
        "action": "OBSERVE_ONLY",
    }

    # No EC2/RDS/VPC security-group quarantine is implemented here.
    if (
        ENFORCEMENT_MODE == "enforce"
        and access_key_id
        and user_name
        and severity >= 7
    ):
        iam.update_access_key(
            UserName=user_name,
            AccessKeyId=access_key_id,
            Status="Inactive",
        )
        result["action"] = "IAM_ACCESS_KEY_DISABLED"
        result["user_name"] = user_name

    print(json.dumps(result))
    return {
        "statusCode": 200,
        "body": json.dumps(result),
    }
