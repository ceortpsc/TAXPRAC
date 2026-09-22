from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any, Dict, Iterable, List


SUPPORTED_OPERATIONS = {
    "sum",
    "reconciliation_delta",
    "percentage",
    "variance",
    "evidence_score",
}

YEAR_POLICY = {
    2020: "ARCHIVED_SOURCE_REQUIRED",
    2021: "ARCHIVED_SOURCE_REQUIRED",
    2022: "ARCHIVED_SOURCE_REQUIRED",
    2023: "ARCHIVED_SOURCE_REQUIRED",
    2024: "ARCHIVED_SOURCE_REQUIRED",
    2025: "CORE_RULE_PACK_ACTIVE",
    2026: "FINAL_IRS_SOURCE_PACKAGE_REQUIRED",
}


@dataclass(frozen=True)
class ExecutionPolicy:
    arbitrary_code_execution: bool = False
    ai_can_override_math: bool = False
    external_status_auto_verified: bool = False
    human_release_required: bool = True
    canonical_xml_is_mef_xml: bool = False


def year_policy(tax_year: int) -> str:
    return YEAR_POLICY.get(tax_year, "UNSUPPORTED_YEAR")


def _decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError) as exc:
        raise ValueError(f"Invalid numeric value: {value!r}") from exc


def _quantize(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _numbers(values: Iterable[Any]) -> List[Decimal]:
    items = [_decimal(value) for value in values]
    if not items:
        raise ValueError("At least one numeric value is required.")
    return items


def execute_calculation(operation: str, values: List[Any]) -> Dict[str, Any]:
    if operation not in SUPPORTED_OPERATIONS:
        raise ValueError("Unsupported Avalon operation.")

    nums = _numbers(values)
    trace: List[str] = [f"operation={operation}", f"inputs={len(nums)}"]

    if operation == "sum":
        result = sum(nums, Decimal("0"))
        trace.append("Summed all supplied workpaper values.")

    elif operation == "reconciliation_delta":
        if len(nums) != 2:
            raise ValueError("reconciliation_delta requires exactly two values.")
        result = nums[0] - nums[1]
        trace.append("Computed source amount minus reconciled amount.")

    elif operation == "percentage":
        if len(nums) != 2:
            raise ValueError("percentage requires exactly two values.")
        if nums[1] == 0:
            raise ValueError("percentage denominator cannot be zero.")
        result = (nums[0] / nums[1]) * Decimal("100")
        trace.append("Computed numerator divided by denominator times 100.")

    elif operation == "variance":
        if len(nums) != 2:
            raise ValueError("variance requires exactly two values.")
        result = nums[0] - nums[1]
        trace.append("Computed actual minus comparison value.")

    else:
        # Evidence completeness is a controlled operational score, not a tax result.
        total = nums[1] if len(nums) > 1 else Decimal("100")
        if total <= 0:
            raise ValueError("evidence_score total must be greater than zero.")
        result = (nums[0] / total) * Decimal("100")
        result = min(max(result, Decimal("0")), Decimal("100"))
        trace.append("Computed evidence items complete divided by expected items.")

    value = _quantize(result)
    return {
        "operation": operation,
        "result": str(value),
        "trace": trace,
        "policy": {
            "arbitrary_code_execution": False,
            "ai_can_override_math": False,
            "external_status_auto_verified": False,
            "human_release_required": True,
            "canonical_xml_is_mef_xml": False,
        },
        "disclaimer": (
            "Avalon provides deterministic operational/workpaper calculations only. "
            "It does not represent an official IRS tax-liability computation, MeF acceptance, "
            "refund determination, or filing release."
        ),
    }


def policy_payload() -> Dict[str, Any]:
    return {
        "year_policy": YEAR_POLICY,
        "supported_operations": sorted(SUPPORTED_OPERATIONS),
        "execution_policy": ExecutionPolicy().__dict__,
        "rules": [
            "Only source-pinned rule packages may drive tax-sensitive calculations.",
            "2020-2024 require archived source packages before tax-sensitive execution.",
            "2025 is the active core rule-pack year.",
            "2026 remains blocked for tax-sensitive execution until final IRS source packages are approved.",
            "Returns below $100,000 require official IRS Tax Table reconciliation where applicable.",
            "Credits and specialist calculations require approved worksheets.",
            "Canonical XML is an internal artifact and is not represented as IRS-valid MeF XML.",
            "Business-return calculation engines must be explicitly marked complete before release.",
            "Live filing requires approved credentials, schemas, endpoints, testing acceptance, signatures, and human release approval.",
        ],
    }
