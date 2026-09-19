import os
import time
from celery import Celery
from supabase import create_client, Client

celery_app = Celery("rtpsc_workers", broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"))

supabase: Client = create_client(
    os.getenv("EXPO_PUBLIC_SUPABASE_URL", "https://tpiuxyxofggsossstyik.supabase.co"), 
    os.getenv("EXPO_PUBLIC_SUPABASE_KEY", "sb_publishable_Fus5iPRQ5-jIV3ePOVxneg_0s8VLQtf")
)

@celery_app.task(bind=True, max_retries=3)
def sync_client_masterfile(self, client_id: str, ssn_last_four: str, caf_number: str):
    try:
        time.sleep(2) # Network latency simulation
        mock_data = {
            "account_balance": 0.00,
            "freeze_codes": ["TC 570"],
            "refund_status": "HELD - LTR 12C ISSUED",
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        
        supabase.table("client_masterfiles").update({
            "imf_data": mock_data,
            "sync_status": "COMPLETED"
        }).eq("id", client_id).execute()

        return {"status": "SUCCESS", "client_id": client_id}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)

@celery_app.task
def process_irs_acknowledgment(payload: dict):
    submission_id = payload.get("submission_id")
    status = payload.get("status")
    supabase.table("transmissions").update({"status": status}).eq("submission_id", submission_id).execute()
    return {"processed": submission_id, "status": status}
