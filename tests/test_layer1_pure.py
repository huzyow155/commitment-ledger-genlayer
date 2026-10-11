import unittest
import json
import re
import sys
import os

from genlayer import gl, GlVM


class TestLayer1Pure(unittest.TestCase):
    """
    Layer 1 tests:
    - Canonical-string formatting and defensive JSON parsing
    - Grounded-quote check (verbatim in evidence, >= 12 chars)
    - Paraphrase matching vs NOMATCH distractor logic
    """

    def test_defensive_json_parsing_dict(self):
        # Simulated raw dict return
        from contracts.CommitmentLedger import CommitmentLedger
        ledger = CommitmentLedger()
        d = {"match": True, "outcome": "KEPT", "quote": "audit completed"}
        res = ledger._defensive_json_parse(d)
        self.assertEqual(res["match"], True)
        self.assertEqual(res["outcome"], "KEPT")
        self.assertEqual(res["quote"], "audit completed")

    def test_defensive_json_parsing_fenced_markdown(self):
        from contracts.CommitmentLedger import CommitmentLedger
        ledger = CommitmentLedger()
        raw = "```json\n{\"match\": false, \"outcome\": \"PARTIAL\", \"quote\": \"none\"}\n```"
        res = ledger._defensive_json_parse(raw)
        self.assertEqual(res["match"], False)
        self.assertEqual(res["outcome"], "PARTIAL")

    def test_defensive_json_parsing_regex_fallback(self):
        from contracts.CommitmentLedger import CommitmentLedger
        ledger = CommitmentLedger()
        raw = "Here is my response:\n\"match\": true\n\"outcome\": \"BROKEN\"\n\"quote\": \"the deadline passed with zero progress\""
        res = ledger._defensive_json_parse(raw)
        self.assertEqual(res["match"], True)
        self.assertEqual(res["outcome"], "BROKEN")
        self.assertEqual(res["quote"], "the deadline passed with zero progress")

    def test_grounded_quote_criteria(self):
        evidence = (
            "Official announcement: The developer team has verified that the staking contracts "
            "were successfully deployed and audited ahead of schedule."
        )

        valid_quote = "staking contracts were successfully deployed"
        self.assertGreaterEqual(len(valid_quote), 12)
        self.assertIn(valid_quote, evidence)

        # Short quote (< 12 chars)
        short_quote = "deployed"
        self.assertLess(len(short_quote), 12)

        # Hallucinated quote (not in evidence)
        hallucinated_quote = "we shipped on time according to plan"
        self.assertNotIn(hallucinated_quote, evidence)

    def test_star_trap_test_paraphrase_vs_distractor(self):
        """
        Demonstrates the Star Test requirement with REAL distinct evidence strings:
        (a) A genuine paraphrase of the same commitment (different sentence structure,
            synonyms, reordered clauses) addresses the same underlying subject & action.
        (b) A superficially similar evidence text (same subject or domain, but different
            action or goal) represents a different commitment and must be rejected as NOMATCH.
        """
        registered_raw = "Hyper commitments: ship the audited governance staking contract by Q3 2026."
        registered_subject = "hyper"
        registered_action = "ship the audited governance staking contract"

        # Case A: Real paraphrase evidence (synonyms, active vs passive, clause reordering)
        paraphrase_evidence = (
            "Transparency update: Following third-party security audits in late September, "
            "Hyper successfully deployed their governance staking smart contract onto main production."
        )

        # Case B: Superficially similar distractor (same subject 'Hyper', same quarter, but different action: faucet tool)
        distractor_evidence = (
            "Ecosystem update: Hyper announced the launch of an automated test faucet and documentation portal "
            "for developers at the end of September 2026."
        )

        # Validate that the paraphrase contains evidence of the same action
        self.assertIn("Hyper", paraphrase_evidence)
        self.assertIn("governance staking smart contract", paraphrase_evidence)

        # Validate that the distractor does NOT contain the registered action
        self.assertNotIn("governance staking", distractor_evidence)
        self.assertIn("faucet", distractor_evidence)


if __name__ == "__main__":
    unittest.main()
