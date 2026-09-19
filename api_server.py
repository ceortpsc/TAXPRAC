import os
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from celery_worker import sync_client_masterfile, process_irs_acknowledgment
from supabase import create_client, Client

app = FastAPI(title="RTPSC Background API Server", version="1.0.0")

SUPABASE_URL = os.getenv("EXPO_PUBLIC_SUPABASE_URL", "https://tpiuxyxofggsossstyik.supabase.co")
SUPABASE_KEY = os.getenv("EXPO_PUBLIC_SUPABASE_KEY", "sb_publishable_Fus5iPRQ5-jIV3ePOVxneg_0s8VLQtf")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class SyncRequest(BaseModel):
    client_id: str
    ssn_last_four: str
    caf_number: str = "0316-76228R"

class IRSAckPayload(BaseModel):
    submission_id: str
    status: str
    timestamp: str
    errors: Optional[List[str]] = None

@app.post("/api/v1/clients/sync")
async def trigger_client_sync(request: SyncRequest):
    task = sync_client_masterfile.delay(request.client_id, request.ssn_last_four, request.caf_number)
    return {"status": "QUEUED", "task_id": task.id}

@app.post("/api/v1/webhooks/irs/ack")
async def irs_acknowledgment_webhook(payload: IRSAckPayload):
    process_irs_acknowledgment.delay(payload.dict())
    return {"status": "RECEIVED"}
