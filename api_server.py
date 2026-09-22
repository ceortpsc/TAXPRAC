import hmac
import os
from typing import List, Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from supabase import Client, create_client

from avalon_engine import execute_calculation, policy_payload
from celery_worker import process_provider_acknowledgment, sync_client_masterfile
from proavalon import assist as proavalon_assist


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Required environment variable is not configured: {name}")
    return value


app = FastAPI(
    title="RTPSC TAXPRAC Background API",
    version="26.9.22",
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


class AvalonCalculationRequest(BaseModel):
    operation: str
    values: List[float]
    tax_year: int = Field(default=2025, ge=2020, le=2026)


class ProAvalonRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=4000)
    tax_year: int = Field(default=2025, ge=2020, le=2026)


@app.get("/healthz")
async def healthz():
    return {"status": "ok", "service": "taxprac-background-api"}


@app.get("/api/v1/avalon/policy")
async def avalon_policy():
    return policy_payload()


@app.post("/api/v1/avalon/calculate")
async def avalon_calculate(request: AvalonCalculationRequest):
    policy = policy_payload()
    year_state = policy["year_policy"].get(request.tax_year, "UNSUPPORTED_YEAR")
    result = execute_calculation(request.operation, request.values)
    return {
        "status": "COMPLETED",
        "tax_year": request.tax_year,
        "tax_year_status": year_state,
        "calculation": result,
        "external_government_data": False,
    }


@app.post("/api/v1/proavalon/assist")
async def proavalon(request: ProAvalonRequest):
    return proavalon_assist(request.prompt, request.tax_year)


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
