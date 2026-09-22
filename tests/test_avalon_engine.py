import unittest

from avalon_engine import execute_calculation, policy_payload, year_policy
from proavalon import assist


class AvalonEngineTests(unittest.TestCase):
    def test_reconciliation_delta(self):
        result = execute_calculation("reconciliation_delta", [1000, 975])
        self.assertEqual(result["result"], "25.00")
        self.assertFalse(result["policy"]["ai_can_override_math"])

    def test_year_gates(self):
        self.assertEqual(year_policy(2025), "CORE_RULE_PACK_ACTIVE")
        self.assertEqual(year_policy(2026), "FINAL_IRS_SOURCE_PACKAGE_REQUIRED")
        self.assertEqual(year_policy(2024), "ARCHIVED_SOURCE_REQUIRED")

    def test_execution_policy_blocks_arbitrary_code(self):
        policy = policy_payload()["execution_policy"]
        self.assertFalse(policy["arbitrary_code_execution"])
        self.assertTrue(policy["human_release_required"])

    def test_proavalon_evidence_router(self):
        result = assist("What evidence is missing before approval?", 2025)
        self.assertEqual(result["intent"], "identify_evidence_gap")
        self.assertEqual(result["tax_year_status"], "CORE_RULE_PACK_ACTIVE")


if __name__ == "__main__":
    unittest.main()
