import unittest
import json
import sys
import os

from genlayer import gl, GlVM
from contracts.CommitmentLedger import CommitmentLedger


class TestLayer2Mocked(unittest.TestCase):
    """
    Layer 2 tests:
    - Resolving an already-resolved commitment is rejected (UserError: commitment already resolved).
    - An ungrounded quote forces PARTIAL, never a confident KEPT/BROKEN.
    - A NOMATCH result does not write any outcome to storage and raises UserError.
    - Resolving non-existent commitment raises UserError.
    """

    def setUp(self):
        self.ledger = CommitmentLedger()
        self.ledger.commitments = {}
        self.ledger.meta = {}

    def test_resolve_nonexistent_commitment_fails(self):
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.submit_resolution("nonexistent_id", "some evidence text here")
        self.assertIn("commitment not found", str(ctx.exception))

    def test_already_resolved_commitment_fails(self):
        # Register a commitment
        gl.nondet.prompt_handler = lambda p: {"subject": "alice", "action": "deploy oracle"}
        cid = self.ledger.register_commitment("Alice will deploy the oracle by July.", "2026-07-31")

        # Resolve it first time
        gl.nondet.prompt_handler = lambda p: {
            "match": True,
            "outcome": "KEPT",
            "quote": "Alice successfully deployed the oracle into main production."
        }
        evidence = "Audit confirmation: Alice successfully deployed the oracle into main production."
        self.ledger.submit_resolution(cid, evidence)

        # Confirm status is RESOLVED
        record = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(record["status"], "RESOLVED")
        self.assertEqual(record["outcome"], "KEPT")

        # Second resolution attempt should fail
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.submit_resolution(cid, evidence)
        self.assertIn("commitment already resolved", str(ctx.exception))

    def test_ungrounded_quote_forces_partial(self):
        # Register commitment
        gl.nondet.prompt_handler = lambda p: {"subject": "bob", "action": "publish whitepaper"}
        cid = self.ledger.register_commitment("Bob will publish the whitepaper by June.", "2026-06-30")

        # LLM attempts to return confident KEPT with a hallucinated quote
        evidence = "Bob posted a short blog saying the project is making steady progress."
        gl.nondet.prompt_handler = lambda p: {
            "match": True,
            "outcome": "KEPT",
            "quote": "Bob published the full 40-page whitepaper on June 15."  # NOT in evidence!
        }

        self.ledger.submit_resolution(cid, evidence)

        record = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(record["status"], "RESOLVED")
        # Outcome forced down to PARTIAL because quote was ungrounded
        self.assertEqual(record["outcome"], "PARTIAL")
        self.assertIsNone(record["resolution_quote"])

    def test_short_quote_forces_partial(self):
        # Register commitment
        gl.nondet.prompt_handler = lambda p: {"subject": "charlie", "action": "release token"}
        cid = self.ledger.register_commitment("Charlie will release the token by August.", "2026-08-31")

        evidence = "Charlie announced: done."
        gl.nondet.prompt_handler = lambda p: {
            "match": True,
            "outcome": "KEPT",
            "quote": "done."  # Only 5 characters (< 12 chars requirement)
        }

        self.ledger.submit_resolution(cid, evidence)

        record = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(record["status"], "RESOLVED")
        self.assertEqual(record["outcome"], "PARTIAL")
        self.assertIsNone(record["resolution_quote"])

    def test_nomatch_does_not_write_outcome_and_leaves_open(self):
        # Register commitment
        gl.nondet.prompt_handler = lambda p: {"subject": "dao", "action": "burn treasury tokens"}
        cid = self.ledger.register_commitment("The DAO will burn 100,000 treasury tokens by Q3.", "2026-09-30")

        # Distractor evidence about a different action (minting tokens instead of burning)
        distractor_evidence = "The DAO governance council voted to mint 50,000 community reward tokens in August."
        gl.nondet.prompt_handler = lambda p: {
            "match": False,
            "outcome": "NONE",
            "quote": ""
        }

        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.submit_resolution(cid, distractor_evidence)
        self.assertIn("evidence does not match this commitment", str(ctx.exception))

        # Commitment must remain OPEN with null outcome
        record = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(record["status"], "OPEN")
        self.assertIsNone(record["outcome"])
        self.assertEqual(record["match_confirmed"], False)


if __name__ == "__main__":
    unittest.main()
