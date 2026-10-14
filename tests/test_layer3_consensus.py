import unittest
import json
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

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
        gl.message_raw = {"datetime": "2026-10-14T10:00:00Z"}

    def test_validators_agree_on_identical_output(self):
        url = "https://en.wikipedia.org/wiki/Apollo_11"
        page_text = "Apollo 11 commander Neil Armstrong and lunar module pilot Buzz Aldrin landed on the Moon in July 1969."
        gl.nondet.web.pages[url] = page_text

        vote_payload = {
            "match": True,
            "elements": [
                {"id": "e1", "kind": "ACTION", "label": "land on the moon", "status": "SATISFIED", "cited_segment_ids": [1]},
                {"id": "e2", "kind": "DEADLINE", "label": "before deadline", "status": "SATISFIED", "cited_segment_ids": [1]}
            ]
        }

        votes = [vote_payload, vote_payload, vote_payload]

        def make_vote_handler(vote):
            def handler(p):
                if "Extract the subject" in p:
                    return {"subject": "apollo 11", "action": "land on the moon"}
                return vote
            return handler

        def multi_val_strict_eq(fn):
            results = []
            for v in votes:
                gl.nondet.prompt_handler = make_vote_handler(v)
                results.append(fn())
            if len(set(results)) != 1:
                raise Exception("EQUIVALENCE_PRINCIPLE_VIOLATION: validators disagreed")
            return results[0]

        original_strict_eq = gl.eq_principle.strict_eq
        original_comp = gl.eq_principle.prompt_comparative
        try:
            gl.eq_principle.strict_eq = multi_val_strict_eq
            gl.eq_principle.prompt_comparative = lambda fn, principle="", mv=multi_val_strict_eq: mv(fn)

            # Register
            gl.nondet.prompt_handler = lambda p: {"subject": "apollo 11", "action": "land on the moon"}
            cid = self.ledger.register_commitment("Apollo 11 will land on the moon", "1969-07-20", "THIRD_PARTY_REPORT", True)

            self.ledger.submit_resolution(cid, url)

            record = json.loads(self.ledger.get_commitment(cid))
            self.assertEqual(record["status"], "PROVISIONAL")
            self.assertEqual(record["outcome"], "KEPT")
            self.assertEqual(record["match_confirmed"], True)
            self.assertEqual(record["source_url"], url)
        finally:
            gl.eq_principle.strict_eq = original_strict_eq

    def test_validators_disagree_on_different_output_fails(self):
        url = "https://en.wikipedia.org/wiki/Apollo_11"
        page_text = "Apollo 11 commander Neil Armstrong and lunar module pilot Buzz Aldrin landed on the Moon in July 1969."
        gl.nondet.web.pages[url] = page_text

        vote_kept = {
            "match": True,
            "elements": [
                {"id": "e1", "kind": "ACTION", "label": "land on the moon", "status": "SATISFIED", "cited_segment_ids": [1]},
                {"id": "e2", "kind": "DEADLINE", "label": "before deadline", "status": "SATISFIED", "cited_segment_ids": [1]}
            ]
        }
        vote_broken = {
            "match": True,
            "elements": [
                {"id": "e1", "kind": "ACTION", "label": "land on the moon", "status": "NOT_SATISFIED", "cited_segment_ids": [1]},
                {"id": "e2", "kind": "DEADLINE", "label": "before deadline", "status": "NOT_SATISFIED", "cited_segment_ids": [1]}
            ]
        }

        votes = [vote_kept, vote_broken, vote_kept]

        def make_vote_handler(vote):
            def handler(p):
                if "Extract the subject" in p:
                    return {"subject": "apollo 11", "action": "land on the moon"}
                return vote
            return handler

        def multi_val_strict_eq(fn):
            results = []
            for v in votes:
                gl.nondet.prompt_handler = make_vote_handler(v)
                results.append(fn())
            if len(set(results)) != 1:
                raise Exception("EQUIVALENCE_PRINCIPLE_VIOLATION: validators disagreed")
            return results[0]

        original_strict_eq = gl.eq_principle.strict_eq
        original_comp = gl.eq_principle.prompt_comparative
        try:
            gl.eq_principle.strict_eq = multi_val_strict_eq
            gl.eq_principle.prompt_comparative = lambda fn, principle="", mv=multi_val_strict_eq: mv(fn)

            # Register
            gl.nondet.prompt_handler = lambda p: {"subject": "apollo 11", "action": "land on the moon"}
            cid = self.ledger.register_commitment("Apollo 11 will land on the moon", "1969-07-20", "THIRD_PARTY_REPORT", True)

            with self.assertRaises(Exception) as ctx:
                self.ledger.submit_resolution(cid, url)
            self.assertIn("EQUIVALENCE_PRINCIPLE_VIOLATION", str(ctx.exception))

            # Commitment remains open
            record = json.loads(self.ledger.get_commitment(cid))
            self.assertEqual(record["status"], "OPEN")
        finally:
            gl.eq_principle.strict_eq = original_strict_eq
            gl.eq_principle.prompt_comparative = original_comp

    def test_validators_agree_on_invalid_output_treated_as_rejection(self):
        url = "https://en.wikipedia.org/wiki/Apollo_11"
        page_text = "Apollo 11 commander Neil Armstrong and lunar module pilot Buzz Aldrin landed on the Moon in July 1969."
        gl.nondet.web.pages[url] = page_text

        # All validators return invalid kind
        vote_invalid = {
            "match": True,
            "elements": [
                {"id": "e1", "kind": "INVALID_KIND", "label": "land on the moon", "status": "SATISFIED", "cited_segment_ids": [1]},
            ]
        }
        votes = [vote_invalid, vote_invalid, vote_invalid]

        def make_vote_handler(vote):
            def handler(p):
                if "Extract the subject" in p:
                    return {"subject": "apollo 11", "action": "land on the moon"}
                return vote
            return handler

        def multi_val_strict_eq(fn):
            results = []
            for v in votes:
                gl.nondet.prompt_handler = make_vote_handler(v)
                results.append(fn())
            if len(set(results)) != 1:
                raise Exception("EQUIVALENCE_PRINCIPLE_VIOLATION: validators disagreed")
            return results[0]

        original_strict_eq = gl.eq_principle.strict_eq
        original_comp = gl.eq_principle.prompt_comparative
        try:
            gl.eq_principle.strict_eq = multi_val_strict_eq
            gl.eq_principle.prompt_comparative = lambda fn, principle="", mv=multi_val_strict_eq: mv(fn)

            gl.nondet.prompt_handler = lambda p: {"subject": "apollo 11", "action": "land on the moon"}
            cid = self.ledger.register_commitment("Apollo 11 will land on the moon", "1969-07-20", "THIRD_PARTY_REPORT", True)

            with self.assertRaises(GlVM.UserError) as ctx:
                self.ledger.submit_resolution(cid, url)
            self.assertIn("model returned no valid outcome", str(ctx.exception))

            # Commitment remains open
            record = json.loads(self.ledger.get_commitment(cid))
            self.assertEqual(record["status"], "OPEN")
            self.assertIsNone(record["outcome"])
        finally:
            gl.eq_principle.strict_eq = original_strict_eq
            gl.eq_principle.prompt_comparative = original_comp


if __name__ == "__main__":
    unittest.main()
