import unittest
import json
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from genlayer import gl, GlVM, GlWebResponse
from contracts.CommitmentLedger import (
    CommitmentLedger,
    _map_elements_to_outcome,
    _select_windows,
    INSPECTION_BUDGET_CHARS,
)


class TestStep0Regressions(unittest.TestCase):
    """
    Step 0 Regression Tests:
    These tests MUST fail on HEAD 0aeab14 and pass after fixing defects 1.1-1.8.
    """

    def setUp(self):
        gl.message_raw = {"datetime": "2026-10-14T12:00:00Z"}
        gl.nondet.prompt_handler = None
        gl.nondet.web.render_handler = None
        gl.nondet.web.get_handler = None
        gl.nondet.web.pages = {}

    def test_regression_1_1_outcome_mapping_partial(self):
        """
        Defect 1.1: Spec requires that when at least one element is SATISFIED,
        none are NOT_SATISFIED, and others are UNDETERMINED/INCONCLUSIVE,
        the outcome must be PARTIAL (not revert).
        On HEAD 0aeab14, line 255 reverts with UserError("insufficient evidence...").
        """
        elements = [
            {"id": "e1", "kind": "ACTION", "label": "test action", "status": "UNDETERMINED", "passage_ids": []},
            {"id": "e2", "kind": "CONDITION", "label": "test condition", "status": "SATISFIED", "passage_ids": [1]},
            {"id": "e3", "kind": "DEADLINE", "label": "test deadline", "status": "UNDETERMINED", "passage_ids": []},
        ]
        outcome = _map_elements_to_outcome(elements, "COMPLETE")
        self.assertEqual(outcome, "PARTIAL", "Expected PARTIAL when at least one element is SATISFIED and no element is NOT_SATISFIED")

    def test_regression_1_2_current_decision_index_after_re_resolve(self):
        """
        Defect 1.2: current_decision_index must equal len(decisions) - 1 after any resolution,
        never a hardcoded 0.
        On HEAD 0aeab14, submit_resolution sets record['current_decision_index'] = 0.
        """
        contract = CommitmentLedger()
        contract.commitments = {}
        contract.meta = {}

        # Mock extraction
        gl.nondet.prompt_handler = lambda p: {"subject": "apollo mission", "action": "land astronauts before 1970"}
        cid = contract.register_commitment("Apollo 11 will land on Moon before 1970.", "1970-01-01", "THIRD_PARTY_REPORT", True)

        # Mock source page
        url = "https://en.wikipedia.org/wiki/Apollo_11"
        gl.nondet.web.pages[url] = "Apollo 11 landed human astronauts on the Moon in July 1969. Mission complete."

        # Mock decision 1: KEPT
        gl.nondet.prompt_handler = lambda p: {
            "match": True,
            "elements": [
                {"id": "e1", "kind": "ACTION", "label": "land astronauts", "status": "SATISFIED", "cited_segment_ids": [1]},
                {"id": "e2", "kind": "DEADLINE", "label": "before 1970", "status": "SATISFIED", "cited_segment_ids": [1]},
            ]
        }
        contract.submit_resolution(cid, url)

        # Mock challenge with UNSUPPORTED_CLASSIFICATION -> model fails grounding -> WITHDRAWN
        gl.nondet.prompt_handler = lambda p: {
            "match": True,
            "elements": [
                {"id": "e1", "kind": "ACTION", "label": "land astronauts", "status": "UNDETERMINED", "cited_segment_ids": []},
                {"id": "e2", "kind": "DEADLINE", "label": "before 1970", "status": "UNDETERMINED", "cited_segment_ids": []},
            ]
        }
        contract.challenge_resolution(cid, "UNSUPPORTED_CLASSIFICATION", url)

        record = json.loads(contract.get_commitment(cid))
        self.assertEqual(record["status"], "OPEN")
        self.assertEqual(len(record["decisions"]), 2)

        # Re-resolve with good grounding -> decision 3
        gl.nondet.prompt_handler = lambda p: {
            "match": True,
            "elements": [
                {"id": "e1", "kind": "ACTION", "label": "land astronauts", "status": "SATISFIED", "cited_segment_ids": [1]},
                {"id": "e2", "kind": "DEADLINE", "label": "before 1970", "status": "SATISFIED", "cited_segment_ids": [1]},
            ]
        }
        contract.submit_resolution(cid, url)

        record = json.loads(contract.get_commitment(cid))
        self.assertEqual(len(record["decisions"]), 3)
        # On HEAD 0aeab14, current_decision_index is hardcoded to 0 instead of 2!
        self.assertEqual(record["current_decision_index"], 2, "current_decision_index must equal newly appended decision index (2)")

    def test_regression_1_3_presented_equals_fingerprinted_metadata(self):
        """
        Defect 1.3: Decision record must report presented_segment_ids, presented_segments_count,
        truncated_at, and budget_chars_used.
        On HEAD 0aeab14, these fields are missing from the stored decision.
        """
        contract = CommitmentLedger()
        contract.commitments = {}
        contract.meta = {}

        gl.nondet.prompt_handler = lambda p: {"subject": "apollo mission", "action": "land astronauts before 1970"}
        cid = contract.register_commitment("Apollo 11 will land on Moon before 1970.", "1970-01-01", "THIRD_PARTY_REPORT", True)

        url = "https://en.wikipedia.org/wiki/Apollo_11"
        gl.nondet.web.pages[url] = "Apollo 11 landed astronauts on the Moon. Mission was a complete success."

        gl.nondet.prompt_handler = lambda p: {
            "match": True,
            "elements": [
                {"id": "e1", "kind": "ACTION", "label": "land astronauts", "status": "SATISFIED", "cited_segment_ids": [1]},
                {"id": "e2", "kind": "DEADLINE", "label": "before 1970", "status": "SATISFIED", "cited_segment_ids": [1]},
            ]
        }
        contract.submit_resolution(cid, url)

        record = json.loads(contract.get_commitment(cid))
        d = record["decisions"][0]
        self.assertIn("presented_segment_ids", d)
        self.assertIn("presented_segments_count", d)
        self.assertIn("truncated_at", d)
        self.assertIn("budget_chars_used", d)

    def test_regression_1_4_source_text_quality_html_stripped(self):
        """
        Defect 1.4: HTML tags, scripts, and entities must be stripped so passages never contain raw HTML.
        On HEAD 0aeab14, CommitmentLedger has no _clean_html function.
        """
        import contracts.CommitmentLedger as cl
        self.assertTrue(hasattr(cl, "_clean_html"), "CommitmentLedger must have _clean_html function")

    def test_regression_1_5_exact_budget_includes_separators(self):
        """
        Defect 1.5: _select_windows must count separators ("\\n[...]\\n") inside INSPECTION_BUDGET_CHARS
        so final presented text never exceeds INSPECTION_BUDGET_CHARS.
        On HEAD 0aeab14, accum_chars ignores separators, causing len(inspected_text) > 12000.
        """
        # Create a document of 40,000 chars with matching keywords spread across multiple 3000-char chunks
        chunk = "keyword test sentence for spaceflight target verification. " * 50  # ~3000 chars
        doc = (chunk + "\n") * 15  # ~45000 chars

        inspected_text, coverage, tot, insp, trunc = _select_windows(doc, "spaceflight target verification")
        self.assertLessEqual(
            len(inspected_text),
            INSPECTION_BUDGET_CHARS,
            f"inspected_text length {len(inspected_text)} exceeded budget {INSPECTION_BUDGET_CHARS}"
        )

    def test_regression_1_6_utc_timezone_normalization(self):
        """
        Defect 1.6: Time handling must normalize offsets (+07:00, -05:00) to UTC datetime.
        If message_raw['datetime'] is '2026-10-14T02:00:00+07:00', the UTC date is '2026-10-13'.
        On HEAD 0aeab14, line 348 does now_str[:10] which incorrectly produces '2026-10-14'.
        """
        gl.message_raw = {"datetime": "2026-10-14T02:00:00+07:00"}
        contract = CommitmentLedger()
        contract.commitments = {}
        contract.meta = {}

        gl.nondet.prompt_handler = lambda p: {"subject": "apollo mission", "action": "land astronauts before 1970"}
        cid = contract.register_commitment("Apollo 11 will land on Moon before 1970.", "1970-01-01", "THIRD_PARTY_REPORT", True)

        record = json.loads(contract.get_commitment(cid))
        self.assertEqual(record["registered_date"], "2026-10-13", "registered_date must be derived from parsed UTC datetime, not string slice")

    def test_regression_1_7_strict_json_parsing_no_markdown_fences(self):
        """
        Defect 1.7: _parse_json_strictly must NOT strip markdown fences;
        markdown-wrapped JSON is invalid JSON and must raise UserError.
        On HEAD 0aeab14, _parse_json_strictly strips fences via regex and succeeds.
        """
        contract = CommitmentLedger()
        fenced_json = "```json\n{\"subject\": \"foo\", \"action\": \"bar\"}\n```"
        with self.assertRaises(gl.vm.UserError):
            contract._parse_json_strictly(fenced_json)

    def test_regression_1_8_registration_atomicity_on_rejection(self):
        """
        Defect 1.8: register_commitment must validate inputs BEFORE touching storage or calling _ensure_meta_init().
        On HEAD 0aeab14, _ensure_meta_init() is called on line 331 before validating raw_text,
        mutating self.meta['nonce'] and self.meta['ids'] even when registration is rejected.
        """
        contract = CommitmentLedger()
        contract.commitments = {}
        contract.meta = {}

        with self.assertRaises(gl.vm.UserError):
            contract.register_commitment("", "2026-10-16", "SELF_DECLARED", False)

        self.assertEqual(len(contract.meta), 0, "storage must remain completely empty after a rejected registration")
        self.assertEqual(len(contract.commitments), 0)


if __name__ == "__main__":
    unittest.main()
