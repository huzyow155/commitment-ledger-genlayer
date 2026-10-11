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
        gl.nondet.web.pages.clear()
        gl.nondet.web.render_handler = None
        gl.nondet.web.get_handler = None

    def test_validators_agree_on_identical_output(self):
        url = "https://en.wikipedia.org/wiki/Apollo_11"
        page_text = "Apollo 11 commander Neil Armstrong and lunar module pilot Buzz Aldrin landed on the Moon in July 1969."
        gl.nondet.web.pages[url] = page_text

        votes = [
            {"match": True, "outcome": "KEPT", "quote": "landed on the Moon in July 1969"},
            {"match": True, "outcome": "KEPT", "quote": "landed on the Moon in July 1969"},
            {"match": True, "outcome": "KEPT", "quote": "landed on the Moon in July 1969"},
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
            gl.nondet.prompt_handler = lambda p: {"subject": "apollo 11", "action": "land on the moon"}
            cid = self.ledger.register_commitment("Apollo 11 will land on the moon", "1969-07-20")

            self.ledger.submit_resolution(cid, url)

            record = json.loads(self.ledger.get_commitment(cid))
            self.assertEqual(record["status"], "RESOLVED")
            self.assertEqual(record["outcome"], "KEPT")
            self.assertEqual(record["match_confirmed"], True)
            self.assertEqual(record["source_url"], url)
        finally:
            gl.eq_principle.strict_eq = original_strict_eq

    def test_validators_disagree_on_different_output_fails(self):
        url = "https://en.wikipedia.org/wiki/Apollo_11"
        page_text = "Apollo 11 commander Neil Armstrong and lunar module pilot Buzz Aldrin landed on the Moon in July 1969."
        gl.nondet.web.pages[url] = page_text

        votes = [
            {"match": True, "outcome": "KEPT", "quote": "landed on the Moon in July 1969"},
            {"match": True, "outcome": "BROKEN", "quote": "landed on the Moon in July 1969"},  # Divergent outcome
            {"match": True, "outcome": "KEPT", "quote": "landed on the Moon in July 1969"},
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
            gl.nondet.prompt_handler = lambda p: {"subject": "apollo 11", "action": "land on the moon"}
            cid = self.ledger.register_commitment("Apollo 11 will land on the moon", "1969-07-20")

            with self.assertRaises(Exception) as ctx:
                self.ledger.submit_resolution(cid, url)
            self.assertIn("EQUIVALENCE_PRINCIPLE_VIOLATION", str(ctx.exception))

            # Commitment remains open
            record = json.loads(self.ledger.get_commitment(cid))
            self.assertEqual(record["status"], "OPEN")
        finally:
            gl.eq_principle.strict_eq = original_strict_eq


if __name__ == "__main__":
    unittest.main()
