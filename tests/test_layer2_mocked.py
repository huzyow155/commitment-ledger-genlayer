import unittest
import json
import inspect
import copy
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from genlayer import gl, GlVM
from contracts.CommitmentLedger import CommitmentLedger, CHALLENGE_WINDOW_SECONDS


class TestLayer2Mocked(unittest.TestCase):
    """
    Layer 2 comprehensive mocked tests covering all 13 areas:
    1. Registration temporal classification & clock guard
    2. Claim kind validation & identity unverified
    3. Malformed extraction & storage rollback
    4. Full statement prompt inspection
    5. Missed deadline rule
    6. Window selection beyond 6k chars
    7. Absence rule & grounding
    8. Malformed model outputs & NOMATCH
    9. Challenge state machine (CONFLICTING_EVIDENCE & UNSUPPORTED_CLASSIFICATION)
    10. Finalize resolution
    11. Decision history immutability
    12. Views storage immutability
    13. Guardrail rejections
    """

    def setUp(self):
        self.ledger = CommitmentLedger()
        self.ledger.commitments = {}
        self.ledger.meta = {}
        gl.nondet.web.pages.clear()
        gl.nondet.web.render_handler = None
        gl.nondet.web.get_handler = None
        gl.message_raw = {"datetime": "2026-10-14T10:00:00Z"}
        self.default_url = "https://en.wikipedia.org/wiki/Apollo_11"
        self.default_page = (
            "Apollo 11 was the American spaceflight that first landed humans on the Moon. "
            "Commander Neil Armstrong and lunar module pilot Buzz Aldrin landed on July 20, 1969."
        )
        gl.nondet.web.pages[self.default_url] = self.default_page

    def _mock_extraction(self, subject="nasa", action="land on the moon"):
        return {"subject": subject, "action": action}

    def _mock_adjudication(self, match=True, elements=None):
        if elements is None:
            elements = [
                {"id": "e1", "kind": "ACTION", "label": "land on the moon", "status": "SATISFIED", "cited_segment_ids": [1]},
                {"id": "e2", "kind": "DEADLINE", "label": "completed before deadline", "status": "SATISFIED", "cited_segment_ids": [1]}
            ]
        return {"match": match, "elements": elements}

    # 1. Registration class tests
    def test_registration_temporal_classification(self):
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()

        # Future deadline -> PROSPECTIVE and ACCOUNTABILITY
        cid1 = self.ledger.register_commitment(
            "NASA will land astronauts on Mars.",
            "2026-10-15",
            "SELF_DECLARED",
            False
        )
        rec1 = json.loads(self.ledger.get_commitment(cid1))
        self.assertEqual(rec1["registration_class"], "PROSPECTIVE")
        self.assertEqual(rec1["record_class"], "ACCOUNTABILITY")
        self.assertEqual(rec1["registered_date"], "2026-10-14")
        self.assertEqual(rec1["registered_at"], "2026-10-14T10:00:00Z")
        self.assertEqual(rec1["registered_at_ts"], 1791972000)

        # Same day deadline (2026-10-14) without ack reverts
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.register_commitment(
                "NASA will finish the report today.",
                "2026-10-14",
                "SELF_DECLARED",
                False
            )
        self.assertIn("deadline is not after registration date; set retrospective_ack to record a historical claim", str(ctx.exception))

        # Past deadline (1970-01-01) without ack reverts
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.register_commitment(
                "Apollo 11 landed humans on the Moon.",
                "1970-01-01",
                "SELF_DECLARED",
                False
            )
        self.assertIn("deadline is not after registration date", str(ctx.exception))

        # Past deadline with retrospective_ack=True -> RETROSPECTIVE and HISTORICAL_ANALYSIS
        cid2 = self.ledger.register_commitment(
            "Apollo 11 landed humans on the Moon.",
            "1970-01-01",
            "THIRD_PARTY_REPORT",
            True
        )
        rec2 = json.loads(self.ledger.get_commitment(cid2))
        self.assertEqual(rec2["registration_class"], "RETROSPECTIVE")
        self.assertEqual(rec2["record_class"], "HISTORICAL_ANALYSIS")

        # Future deadline with ack=True stays PROSPECTIVE
        cid3 = self.ledger.register_commitment(
            "NASA will launch Artemis II.",
            "2026-10-20",
            "SELF_DECLARED",
            True
        )
        rec3 = json.loads(self.ledger.get_commitment(cid3))
        self.assertEqual(rec3["registration_class"], "PROSPECTIVE")

        # Clock unavailable reverts
        gl.message_raw = {}
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.register_commitment("No clock test.", "2026-10-20", "SELF_DECLARED", False)
        self.assertIn("clock unavailable", str(ctx.exception))

    # 2. Claim kind validation tests
    def test_claim_kind_validation(self):
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()

        # SELF_DECLARED accepted
        cid1 = self.ledger.register_commitment("Alice will publish code.", "2026-10-20", "SELF_DECLARED", False)
        rec1 = json.loads(self.ledger.get_commitment(cid1))
        self.assertEqual(rec1["claim_kind"], "SELF_DECLARED")
        self.assertFalse(rec1["identity_verified"])

        # THIRD_PARTY_REPORT accepted
        cid2 = self.ledger.register_commitment("Bob published news.", "2026-10-20", "THIRD_PARTY_REPORT", False)
        rec2 = json.loads(self.ledger.get_commitment(cid2))
        self.assertEqual(rec2["claim_kind"], "THIRD_PARTY_REPORT")
        self.assertFalse(rec2["identity_verified"])

        # Invalid claim_kind reverts
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.register_commitment("Invalid claim kind.", "2026-10-20", "INVALID_KIND", False)
        self.assertIn("claim_kind must be SELF_DECLARED or THIRD_PARTY_REPORT", str(ctx.exception))

        # Empty claim_kind reverts
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.register_commitment("Empty claim kind.", "2026-10-20", "", False)
        self.assertIn("claim_kind must be SELF_DECLARED or THIRD_PARTY_REPORT", str(ctx.exception))

    # 3. Malformed extraction & storage rollback
    def test_malformed_extraction_reverts_without_storage_mutation(self):
        meta_before = dict(self.ledger.meta)
        commitments_before = dict(self.ledger.commitments)

        malformed_cases = [
            "not a json response",
            '{"wrong_key": "val"}',
            '{"subject": "", "action": "deploy"}',
            '{"subject": "al", "action": "deploy"}',  # < 3 chars
            '{"subject": "alice", "action": "go"}',  # < 3 chars
            '{"subject": "unknown", "action": "deploy"}',
            '{"subject": "alice", "action": "Unknown"}',
            '{}',
        ]

        for bad_resp in malformed_cases:
            gl.nondet.prompt_handler = lambda p, resp=bad_resp: resp
            with self.assertRaises(GlVM.UserError) as ctx:
                self.ledger.register_commitment("Alice will deploy oracle.", "2026-10-20", "SELF_DECLARED", False)
            self.assertTrue(
                "malformed extraction" in str(ctx.exception) or "malformed JSON from model" in str(ctx.exception)
            )

            # Nonce and commitments must be untouched
            self.assertEqual(self.ledger.meta.get("nonce", "0"), meta_before.get("nonce", "0"))
            self.assertEqual(self.ledger.commitments, commitments_before)

    # 4. Conditions omitted by summarisation regression test
    def test_full_statement_prompt_inspection(self):
        captured_prompts = []

        def capture_prompts(p):
            captured_prompts.append(p)
            if "Extract the subject" in p:
                # LLM summarizes omitting the condition
                return {"subject": "apollo 11", "action": "land astronauts on the lunar surface"}
            return self._mock_adjudication()

        gl.nondet.prompt_handler = capture_prompts

        raw_statement = "Apollo 11 will put all three of its astronauts on the lunar surface before 1970."
        cid = self.ledger.register_commitment(raw_statement, "1970-01-01", "THIRD_PARTY_REPORT", True)

        self.ledger.submit_resolution(cid, self.default_url)

        # Adjudication prompt must contain the full raw statement
        adjudication_prompts = [p for p in captured_prompts if "expert impartial adjudicator" in p]
        self.assertTrue(len(adjudication_prompts) > 0)
        adj_prompt = adjudication_prompts[0]
        self.assertIn(raw_statement, adj_prompt)
        self.assertIn("put all three of its astronauts", adj_prompt)

    # 5. Missed deadline rule
    def test_missed_deadline_resolves_broken(self):
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()
        cid = self.ledger.register_commitment("Apollo 11 will land before July 1.", "1969-07-01", "THIRD_PARTY_REPORT", True)

        # Mock adjudication where action is SATISFIED but deadline is NOT_SATISFIED (landed July 20, missed July 1)
        gl.nondet.prompt_handler = lambda p: self._mock_adjudication(elements=[
            {"id": "e1", "kind": "ACTION", "label": "land astronauts on moon", "status": "SATISFIED", "cited_segment_ids": [1]},
            {"id": "e2", "kind": "DEADLINE", "label": "completed on or before 1969-07-01", "status": "NOT_SATISFIED", "cited_segment_ids": [2]}
        ])

        self.ledger.submit_resolution(cid, self.default_url)
        record = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(record["outcome"], "BROKEN")

    # 6. Window selection beyond 6k chars
    def test_window_selection_passage_beyond_6k_chars(self):
        gl.nondet.prompt_handler = lambda p: {"subject": "nasa", "action": "launch artemis"}
        cid = self.ledger.register_commitment("NASA will launch the Artemis rocket.", "2026-01-01", "SELF_DECLARED", True)

        # Build page with > 6k preamble and total page > 12000 chars
        long_preamble = "General filler text describing science history. " * 200  # ~9600 chars
        decisive_passage = "NASA officially launched the Artemis rocket into deep space orbit successfully."
        postamble = "More filler text describing telescopes. " * 150  # ~6000 chars
        full_page = long_preamble + decisive_passage + postamble

        url = "https://www.nasa.gov/artemis"
        gl.nondet.web.pages[url] = full_page

        def adjudicate_long_page(p):
            if "Extract the subject" in p:
                return {"subject": "nasa", "action": "launch artemis"}
            # Model finds the segment from the selected window
            self.assertIn("Artemis rocket", p)
            return {
                "match": True,
                "elements": [
                    {"id": "e1", "kind": "ACTION", "label": "launch artemis", "status": "SATISFIED", "cited_segment_ids": [1]},
                    {"id": "e2", "kind": "DEADLINE", "label": "completed on or before 2026-01-01", "status": "SATISFIED", "cited_segment_ids": [1]}
                ]
            }

        gl.nondet.prompt_handler = adjudicate_long_page
        self.ledger.submit_resolution(cid, url)

        record = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(record["outcome"], "KEPT")
        self.assertEqual(record["decisions"][0]["coverage"], "SELECTED_WINDOWS")
        self.assertIn("presented_segment_ids", record["decisions"][0])
        self.assertTrue(len(record["decisions"][0]["presented_segment_ids"]) > 0)
        self.assertEqual(
            record["decisions"][0]["presented_segments_count"],
            len(record["decisions"][0]["presented_segment_ids"])
        )
        self.assertLessEqual(record["decisions"][0]["budget_chars_used"], 12000)

    def test_unpresented_segment_citation_rejected(self):
        gl.nondet.prompt_handler = lambda p: {"subject": "apollo", "action": "fly"}
        cid = self.ledger.register_commitment("Apollo will fly.", "2026-01-01", "SELF_DECLARED", True)

        gl.nondet.web.pages[self.default_url] = "Short text passage."
        # Model cites segment 9999 which was not presented
        gl.nondet.prompt_handler = lambda p: {
            "match": True,
            "elements": [
                {"id": "e1", "kind": "ACTION", "label": "fly", "status": "SATISFIED", "cited_segment_ids": [9999]},
                {"id": "e2", "kind": "DEADLINE", "label": "on time", "status": "SATISFIED", "cited_segment_ids": [9999]}
            ]
        }
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.submit_resolution(cid, self.default_url)
        self.assertIn("model returned no valid outcome", str(ctx.exception))

    # 7. Absence rule & grounding
    def test_absence_rule_downgrades_to_undetermined_and_reverts(self):
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()
        cid = self.ledger.register_commitment("Project X will ship feature.", "2026-01-01", "SELF_DECLARED", True)

        # All elements ungrounded -> both downgraded to UNDETERMINED -> reverts
        gl.nondet.prompt_handler = lambda p: self._mock_adjudication(elements=[
            {"id": "e1", "kind": "ACTION", "label": "ship feature", "status": "NOT_SATISFIED", "cited_segment_ids": []},
            {"id": "e2", "kind": "DEADLINE", "label": "before deadline", "status": "SATISFIED", "cited_segment_ids": []}
        ])

        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.submit_resolution(cid, self.default_url)
        self.assertIn("insufficient evidence for a conclusive outcome", str(ctx.exception))

        record = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(record["status"], "OPEN")
        self.assertIsNone(record["outcome"])

        # When one is SATISFIED and grounded, but the other is ungrounded -> PARTIAL
        gl.nondet.prompt_handler = lambda p: self._mock_adjudication(elements=[
            {"id": "e1", "kind": "ACTION", "label": "ship feature", "status": "NOT_SATISFIED", "cited_segment_ids": []},
            {"id": "e2", "kind": "DEADLINE", "label": "before deadline", "status": "SATISFIED", "cited_segment_ids": [1]}
        ])
        self.ledger.submit_resolution(cid, self.default_url)
        rec_partial = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(rec_partial["status"], "PROVISIONAL")
        self.assertEqual(rec_partial["outcome"], "PARTIAL")

    # 8. Malformed model outputs & NOMATCH
    def test_malformed_model_outputs_and_nomatch(self):
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()
        cid = self.ledger.register_commitment("Alice will deploy oracle.", "2026-01-01", "SELF_DECLARED", True)

        # Case A: NOMATCH
        gl.nondet.prompt_handler = lambda p: {"match": False, "elements": []}
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.submit_resolution(cid, self.default_url)
        self.assertIn("source does not match this commitment", str(ctx.exception))

        # Case B: Malformed elements
        bad_outputs = [
            {"match": True, "elements": "not a list"},
            {"match": True, "elements": []},
            {"match": True, "elements": [{"kind": "INVALID_KIND"}]},
            "not json at all"
        ]
        for bad in bad_outputs:
            gl.nondet.prompt_handler = lambda p, b=bad: b
            with self.assertRaises(GlVM.UserError) as ctx:
                self.ledger.submit_resolution(cid, self.default_url)
            err_msg = str(ctx.exception)
            self.assertTrue(
                "model returned no valid outcome" in err_msg
                or "source does not match this commitment" in err_msg
                or "malformed JSON from model" in err_msg
            )

    # 9. Challenge state machine (every transition)
    def test_challenge_state_machine_flow(self):
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()
        cid = self.ledger.register_commitment("Apollo 11 will land on the Moon.", "1969-07-20", "THIRD_PARTY_REPORT", True)

        # Cannot challenge in OPEN status
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.challenge_resolution(cid, "CONFLICTING_EVIDENCE", "https://apnews.com/apollo11")
        self.assertIn("commitment is not in provisional status", str(ctx.exception))

        # Initial resolution -> PROVISIONAL status
        gl.nondet.prompt_handler = lambda p: self._mock_adjudication()
        self.ledger.submit_resolution(cid, self.default_url)

        rec = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(rec["status"], "PROVISIONAL")
        self.assertEqual(rec["outcome"], "KEPT")
        self.assertEqual(rec["challenge_deadline_ts"], 1791972000 + CHALLENGE_WINDOW_SECONDS)
        self.assertEqual(len(rec["decisions"]), 1)

        # Challenge with CONFLICTING_EVIDENCE reusing same URL reverts
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.challenge_resolution(cid, "CONFLICTING_EVIDENCE", self.default_url)
        self.assertIn("source already used for this commitment", str(ctx.exception))

        # Challenge with CONFLICTING_EVIDENCE with different source returning same outcome -> UPHELD
        url2 = "https://apnews.com/article/apollo-11-landing"
        gl.nondet.web.pages[url2] = "AP News confirmed Apollo 11 landed humans on the Moon successfully in July 1969."
        self.ledger.challenge_resolution(cid, "CONFLICTING_EVIDENCE", url2)

        rec = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(len(rec["decisions"]), 2)
        self.assertEqual(rec["decisions"][1]["review_result"], "UPHELD")
        self.assertEqual(rec["status"], "PROVISIONAL")
        self.assertEqual(rec["outcome"], "KEPT")

        # Challenge with CONFLICTING_EVIDENCE returning divergent outcome -> DISPUTED
        url3 = "https://www.reuters.com/article/apollo-dispute"
        gl.nondet.web.pages[url3] = "Reuters reported mission controllers aborted the lunar descent."
        gl.nondet.prompt_handler = lambda p: self._mock_adjudication(elements=[
            {"id": "e1", "kind": "ACTION", "label": "land astronauts on moon", "status": "NOT_SATISFIED", "cited_segment_ids": [1]},
            {"id": "e2", "kind": "DEADLINE", "label": "before deadline", "status": "NOT_SATISFIED", "cited_segment_ids": [1]}
        ])
        self.ledger.challenge_resolution(cid, "CONFLICTING_EVIDENCE", url3)

        rec = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(len(rec["decisions"]), 3)
        self.assertEqual(rec["decisions"][2]["review_result"], "DISPUTED")
        self.assertEqual(rec["outcome"], "DISPUTED")

        # 4th challenge reaches limit and reverts
        url4 = "https://www.bbc.com/news/apollo"
        gl.nondet.web.pages[url4] = "BBC report."
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.challenge_resolution(cid, "CONFLICTING_EVIDENCE", url4)
        self.assertIn("challenge limit reached", str(ctx.exception))

    def test_challenge_unsupported_classification_flow(self):
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()
        cid = self.ledger.register_commitment("Apollo 11 will land on the Moon.", "1969-07-20", "THIRD_PARTY_REPORT", True)

        gl.nondet.prompt_handler = lambda p: self._mock_adjudication()
        self.ledger.submit_resolution(cid, self.default_url)

        # UNSUPPORTED_CLASSIFICATION with different URL reverts
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.challenge_resolution(cid, "UNSUPPORTED_CLASSIFICATION", "https://apnews.com/different")
        self.assertIn("challenge must re-review the effective source", str(ctx.exception))

        # UNSUPPORTED_CLASSIFICATION where model cannot ground every element -> WITHDRAWN
        # (status resets to OPEN, effective outcome is None, decision preserved)
        gl.nondet.prompt_handler = lambda p: self._mock_adjudication(elements=[
            {"id": "e1", "kind": "ACTION", "label": "land astronauts on moon", "status": "UNDETERMINED", "cited_segment_ids": []},
            {"id": "e2", "kind": "DEADLINE", "label": "before deadline", "status": "SATISFIED", "cited_segment_ids": [1]}
        ])
        self.ledger.challenge_resolution(cid, "UNSUPPORTED_CLASSIFICATION", self.default_url)

        rec = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(rec["status"], "OPEN")
        self.assertIsNone(rec["outcome"])
        self.assertEqual(len(rec["decisions"]), 2)
        self.assertEqual(rec["decisions"][1]["review_result"], "WITHDRAWN")

    def test_challenge_window_expired_reverts(self):
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()
        cid = self.ledger.register_commitment("Apollo 11 will land on the Moon.", "1969-07-20", "THIRD_PARTY_REPORT", True)

        gl.nondet.prompt_handler = lambda p: self._mock_adjudication()
        self.ledger.submit_resolution(cid, self.default_url)

        # Advance clock past challenge_deadline_ts (+601s)
        gl.message_raw = {"datetime": "2026-10-14T10:10:01Z"}
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.challenge_resolution(cid, "CONFLICTING_EVIDENCE", "https://apnews.com/apollo11")
        self.assertIn("challenge window has expired", str(ctx.exception))

    # 10. Finalize resolution tests
    def test_finalize_resolution(self):
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()
        cid = self.ledger.register_commitment("Apollo 11 will land on the Moon.", "1969-07-20", "THIRD_PARTY_REPORT", True)

        # Cannot finalize OPEN commitment
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.finalize_resolution(cid)
        self.assertIn("commitment is not in provisional status", str(ctx.exception))

        gl.nondet.prompt_handler = lambda p: self._mock_adjudication()
        self.ledger.submit_resolution(cid, self.default_url)

        # Finalize while window still open reverts
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.finalize_resolution(cid)
        self.assertIn("challenge window still open", str(ctx.exception))

        # Advance clock past window (+600s)
        gl.message_raw = {"datetime": "2026-10-14T10:10:01Z"}
        self.ledger.finalize_resolution(cid)

        rec = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(rec["status"], "FINAL")
        self.assertEqual(rec["finalized_at"], "2026-10-14T10:10:01Z")

        # Calling finalize again reverts
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.finalize_resolution(cid)
        self.assertIn("commitment is final", str(ctx.exception))

        # Calling submit_resolution on FINAL reverts
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.submit_resolution(cid, self.default_url)
        self.assertIn("commitment already resolved", str(ctx.exception))

    def test_finalize_resolution_budget_exhausted_immediate(self):
        """
        Verify that when decision cap (MAX_DECISIONS = 3) is reached,
        finalization is permitted immediately even before the challenge window elapses.
        """
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()
        cid = self.ledger.register_commitment("Apollo 11 will land on the Moon.", "1969-07-20", "THIRD_PARTY_REPORT", True)

        gl.nondet.prompt_handler = lambda p: self._mock_adjudication()
        # Decision 1 (INITIAL)
        self.ledger.submit_resolution(cid, self.default_url)

        # Decision 2 (UPHELD)
        url2 = "https://apnews.com/article/apollo-11-landing"
        gl.nondet.web.pages[url2] = "AP News confirmed Apollo 11 landed humans on the Moon successfully in July 1969."
        self.ledger.challenge_resolution(cid, "CONFLICTING_EVIDENCE", url2)

        # Decision 3 (DISPUTED) - reaches MAX_DECISIONS
        url3 = "https://www.reuters.com/article/apollo-dispute"
        gl.nondet.web.pages[url3] = "Reuters reported mission controllers aborted the lunar descent."
        gl.nondet.prompt_handler = lambda p: self._mock_adjudication(elements=[
            {"id": "e1", "kind": "ACTION", "label": "land astronauts on moon", "status": "NOT_SATISFIED", "cited_segment_ids": [1]},
            {"id": "e2", "kind": "DEADLINE", "label": "before deadline", "status": "NOT_SATISFIED", "cited_segment_ids": [1]}
        ])
        self.ledger.challenge_resolution(cid, "CONFLICTING_EVIDENCE", url3)

        rec = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(len(rec["decisions"]), 3)
        # Clock has NOT advanced: current_ts (1791972000) is well before challenge_deadline_ts (1791972600)
        self.assertLess(1791972000, rec["challenge_deadline_ts"])

        # Finalize succeeds immediately via budget_exhausted branch without waiting for window
        self.ledger.finalize_resolution(cid)
        rec_final = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(rec_final["status"], "FINAL")
        self.assertEqual(rec_final["finalized_at"], "2026-10-14T10:00:00Z")

    # 11. Immutability of earlier decisions
    def test_decision_history_immutability(self):
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()
        cid = self.ledger.register_commitment("Apollo 11 will land on the Moon.", "1969-07-20", "THIRD_PARTY_REPORT", True)

        gl.nondet.prompt_handler = lambda p: self._mock_adjudication()
        self.ledger.submit_resolution(cid, self.default_url)

        rec = json.loads(self.ledger.get_commitment(cid))
        decision_0_snapshot = copy.deepcopy(rec["decisions"][0])

        # Run a challenge
        url2 = "https://apnews.com/apollo"
        gl.nondet.web.pages[url2] = "AP News report."
        self.ledger.challenge_resolution(cid, "CONFLICTING_EVIDENCE", url2)

        rec_after = json.loads(self.ledger.get_commitment(cid))
        self.assertEqual(rec_after["decisions"][0], decision_0_snapshot)

    # 12. Views do not mutate storage
    def test_views_do_not_mutate_storage(self):
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()
        cid = self.ledger.register_commitment("Alice will publish code.", "2026-10-20", "SELF_DECLARED", False)

        meta_snap = dict(self.ledger.meta)
        commitments_snap = dict(self.ledger.commitments)

        # Call all views
        self.ledger.get_commitment(cid)
        self.ledger.get_decision_history(cid)
        self.ledger.list_commitments_by_registrant("0x1111111111111111111111111111111111111111", 10)

        self.assertEqual(self.ledger.meta, meta_snap)
        self.assertEqual(self.ledger.commitments, commitments_snap)

    # 13. General guardrails
    def test_general_guardrails(self):
        gl.nondet.prompt_handler = lambda p: self._mock_extraction()
        cid = self.ledger.register_commitment("Alice will publish code.", "2026-10-20", "SELF_DECLARED", False)

        # Nonexistent commitment
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.submit_resolution("bad_cid", self.default_url)
        self.assertIn("commitment not found", str(ctx.exception))

        # Premature resolution before deadline (clock is 2026-10-14, deadline 2026-10-20)
        with self.assertRaises(GlVM.UserError) as ctx:
            self.ledger.submit_resolution(cid, self.default_url)
        self.assertIn("cannot resolve before deadline date", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
