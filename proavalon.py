from __future__ import annotations

from typing import Dict, List

from avalon_engine import policy_payload, year_policy


CAPABILITIES: List[str] = [
    "explain_control",
    "route_workflow",
    "identify_evidence_gap",
    "summarize_calculation_trace",
    "draft_internal_review_note",
    "surface_rule_pack_status",
]


def _intent(prompt: str) -> str:
    text = prompt.lower()
    if any(word in text for word in ("evidence", "missing", "document", "proof")):
        return "identify_evidence_gap"
    if any(word in text for word in ("year", "2025", "2026", "archive", "rule pack")):
        return "surface_rule_pack_status"
    if any(word in text for word in ("calculate", "math", "reconcile", "variance", "percentage")):
        return "summarize_calculation_trace"
    if any(word in text for word in ("route", "next", "workflow", "stage")):
        return "route_workflow"
    if any(word in text for word in ("draft", "note", "message")):
        return "draft_internal_review_note"
    return "explain_control"


def assist(prompt: str, tax_year: int = 2025) -> Dict[str, object]:
    cleaned = prompt.strip()
    if not cleaned:
        raise ValueError("Prompt is required.")

    intent = _intent(cleaned)
    status = year_policy(tax_year)
    policy = policy_payload()

    guidance = {
        "explain_control": (
            "Use source-of-truth records first. Treat AI output as an explanation layer, "
            "not as proof of an external IRS, processor, bank, signature, or filing event."
        ),
        "route_workflow": (
            "Route the item to the next permitted state only after required evidence and "
            "approval gates are satisfied."
        ),
        "identify_evidence_gap": (
            "List the missing source, owner, date/period, tax matter, authorization scope, "
            "and authoritative evidence needed before the status can be verified."
        ),
        "summarize_calculation_trace": (
            "Use the deterministic Avalon engine for arithmetic and preserve the complete "
            "execution trace. AI may explain the result but may not replace or alter the math."
        ),
        "draft_internal_review_note": (
            "Draft an internal note that distinguishes confirmed source facts, unresolved "
            "questions, proposed next action, and approval requirements."
        ),
        "surface_rule_pack_status": (
            f"Tax year {tax_year} policy status: {status}. "
            "Tax-sensitive execution remains governed by the versioned source package."
        ),
    }[intent]

    return {
        "assistant": "ProAvalon",
        "intent": intent,
        "tax_year": tax_year,
        "tax_year_status": status,
        "response": guidance,
        "capabilities": CAPABILITIES,
        "guardrails": policy["execution_policy"],
        "source_of_truth": "Deterministic rules + approved evidence + human release.",
    }
