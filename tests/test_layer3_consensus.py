import unittest
import json
from genlayer import gl, GlVM
from contracts.CommitmentLedger import CommitmentLedger


class TestLayer3Consensus(unittest.TestCase):
    """
    Layer 3 tests:
    - Multi-validator simulation: validators agree on identical LLM outputs -> consensus accepted.
    - Validators disagree on outputs -> strict_eq fails (consensus failure / equivalence violation).
    """

    def setUp(self):
        self.ledger = CommitmentLedger()
        self.ledger.commitments = {}
        self.ledger.meta = {}

    def test_validators_agree_on_identical_output(self):
        votes = [
            {"match": True, "outcome": "KEPT", "quote": "Hyper has shipped the main commitment ledger contract."},
            {"match": True, "outcome": "KEPT", "quote": "Hyper has shipped the main commitment ledger contract."},
            {"match": True, "outcome": "KEPT", "quote": "Hyper has shipped the main commitment ledger contract."},
        ]

        # Multi-validator consensus mock
        def multi_val_strict_eq(fn):
            results = []
            for v in votes:
                gl.nondet.prompt_handler = lambda p, vote=v: vote
                results.append(fn())
            # All validators must return identical canonical string
            if len(set(results)) != 1:
                raise Exception("EQUIVALENCE_PRINCIPLE_VIOLATION: validators disagreed")
            return results[0]

        original_strict_eq = gl.eq_principle.strict_eq
        try:
            gl.eq_principle.strict_eq = multi_val_strict_eq

            # Register
            gl.nondet.prompt_handler = lambda p: {"subject": "hyper", "action": "ship main commitment ledger"}
            cid = self.ledger.register_commitment("Hyper will ship main commitment ledger", "2026-12-31")

            evidence = "Official announcement: Hyper has shipped the main commitment ledger contract."
            self.ledger.submit_resolution(cid, evidence)

            record = json.loads(self.ledger.get_commitment(cid))
            self.assertEqual(record["status"], "RESOLVED")
            self.assertEqual(record["outcome"], "KEPT")
            self.assertEqual(record["match_confirmed"], True)
        finally:
            gl.eq_principle.strict_eq = original_strict_eq

    def test_validators_disagree_on_different_output_fails(self):
        votes = [
            {"match": True, "outcome": "KEPT", "quote": "Hyper has shipped the main commitment ledger contract."},
            {"match": True, "outcome": "BROKEN", "quote": "Hyper has shipped the main commitment ledger contract."}, # Divergent outcome
            {"match": True, "outcome": "KEPT", "quote": "Hyper has shipped the main commitment ledger contract."},
        ]

        def multi_val_strict_eq(fn):
            results = []
            for v in votes:
                gl.nondet.prompt_handler = lambda p, vote=v: vote
                results.append(fn())
            if len(set(results)) != 1:
                raise Exception("EQUIVALENCE_PRINCIPLE_VIOLATION: validators disagreed")
            return results[0]

        original_strict_eq = gl.eq_principle.strict_eq
        try:
            gl.eq_principle.strict_eq = multi_val_strict_eq

            # Register
            gl.nondet.prompt_handler = lambda p: {"subject": "hyper", "action": "ship main commitment ledger"}
            cid = self.ledger.register_commitment("Hyper will ship main commitment ledger", "2026-12-31")

            evidence = "Official announcement: Hyper has shipped the main commitment ledger contract."
            with self.assertRaises(Exception) as ctx:
                self.ledger.submit_resolution(cid, evidence)
            self.assertIn("EQUIVALENCE_PRINCIPLE_VIOLATION", str(ctx.exception))

            # Commitment remains open
            record = json.loads(self.ledger.get_commitment(cid))
            self.assertEqual(record["status"], "OPEN")
        finally:
            gl.eq_principle.strict_eq = original_strict_eq


if __name__ == "__main__":
    unittest.main()
