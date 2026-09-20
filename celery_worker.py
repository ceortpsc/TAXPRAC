import os

from celery import Celery
from supabase import Client, create_client


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Required environment variable is not configured: {name}")
    return value


celery_app = Celery("rtpsc_workers", broker=required_env("REDIS_URL"))

supabase: Client = create_client(
    required_env("SUPABASE_URL"),
    required_env("SUPABASE_PUBLISHABLE_KEY"),
)


@celery_app.task(bind=True, max_retries=3)
def sync_client_masterfile(self, client_id: str, office_id: str):
    """
    Internal workflow synchronization only.

    This task does not access IRS IMF/BMF, TDS, MeF, refund systems, or any
    government endpoint. External data may enter TAXPRAC only through a
    separately authorized and authenticated adapter.
    """
    try:
        supabase.table("client_masterfiles").update(
            {
                "status": "INTERNAL_REVIEW_REQUIRED",
                "account_metadata": {
                    "external_government_data": False,
                    "office_scope": office_id,
                },
            }
        ).eq("id", client_id).eq("office_id", office_id).execute()

        return {
            "status": "SUCCESS",
            "client_id": client_id,
            "office_id": office_id,
            "external_government_data": False,
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task
def process_provider_acknowledgment(payload: dict):
    submission_id = str(payload.get("submission_id", "")).strip()
    status = str(payload.get("status", "")).strip()
    source = str(payload.get("source", "")).strip()

    if not submission_id or not status or not source:
        raise ValueError("Acknowledgement payload is incomplete.")

    supabase.table("transmissions").update(
        {
            "status": status,
            "errors": payload.get("errors"),
            "updated_at": payload.get("timestamp"),
        }
    ).eq("submission_id", submission_id).execute()

    return {
        "processed": submission_id,
        "status": status,
        "source": source,
        "verification": "AUTHORIZED_ADAPTER_IMPORT",
    }
