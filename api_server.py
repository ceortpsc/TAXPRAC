import hmac
import os
from typing import List, Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from supabase import Client, create_client

from celery_worker import process_provider_acknowledgment, sync_client_masterfile


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Required environment variable is not configured: {name}")
    return value


app = FastAPI(
    title="RTPSC TAXPRAC Background API",
    version="25.78.1",
    docs_url=None,
    redoc_url=None,
)

SUPABASE_URL = required_env("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = required_env("SUPABASE_PUBLISHABLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)


class SyncRequest(BaseModel):
    client_id: str
    office_id: str


class ProviderAckPayload(BaseModel):
    submission_id: str
    status: str
    timestamp: str
    errors: Optional[List[str]] = None
    source: str


@app.get("/healthz")
async def healthz():
    return {"status": "ok", "service": "taxprac-background-api"}


@app.post("/api/v1/clients/sync")
async def trigger_client_sync(request: SyncRequest):
    task = sync_client_masterfile.delay(request.client_id, request.office_id)
    return {
        "status": "QUEUED",
        "task_id": task.id,
        "external_government_data": False,
    }


@app.post("/api/v1/webhooks/adapter/ack")
async def provider_acknowledgment_webhook(
    payload: ProviderAckPayload,
    x_rtpsc_adapter_token: Optional[str] = Header(default=None),
):
    if os.getenv("ACK_ADAPTER_ENABLED", "false").lower() != "true":
        raise HTTPException(
            status_code=503,
            detail="External acknowledgement adapter is not enabled.",
        )

    expected = required_env("ACK_ADAPTER_TOKEN")
    supplied = x_rtpsc_adapter_token or ""
    if not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="Invalid adapter authentication.")

    process_provider_acknowledgment.delay(payload.model_dump())
    return {
        "status": "RECEIVED",
        "source": payload.source,
        "verification": "AUTHORIZED_ADAPTER_IMPORT",
    }
