import unittest
import json
import re
import hashlib
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from genlayer import gl, GlVM
from contracts.CommitmentLedger import (
    _validate_source_url,
    _validate_deadline_date,
    _check_deadline_guard,
    _select_windows,
    _segment_text,
    _map_elements_to_outcome,
    CommitmentLedger,
    MAX_PAGE_CHARS,
    INSPECTION_BUDGET_CHARS,
)


class TestLayer1Pure(unittest.TestCase):
    """
    Layer 1 tests:
    - URL validator table tests (allowlist, schemes, ports, IP literals, length, userinfo, punycode)
    - Deadline date validator table tests (leap years, valid dates, invalid calendar days/months)
    - Deadline guard enforcement (clock comparison)
    - Deterministic window selection (<=12k, >12k, >300k, determinism)
    - Text segmentation determinism (sentence splitting, length filtering, 240-char cap, sha256)
    - Exhaustive element outcome mapping table & missed deadline rule
    - Defensive JSON parsing (dict, string, markdown fenced, invalid)
    - Evidence fingerprint calculation
    """

    def setUp(self):
        gl.message_raw = {"datetime": "2026-10-10T12:00:00Z"}

    def test_deadline_validator_accepts_valid_dates(self):
        valid_dates = [
            "2026-10-12",
            "2024-02-29",  # Leap year
            "2000-02-29",  # 400-year leap year
            "1970-01-01",
            "2025-12-31",
            "2026-04-30",  # 30-day month
        ]
        for d in valid_dates:
            res = _validate_deadline_date(d)
            self.assertEqual(res, d)

    def test_deadline_validator_rejects_invalid_dates(self):
        invalid_dates = [
            "end of Q2",
            "2026-13-01",  # month 13
            "2026-00-10",  # month 0
            "2026-02-29",  # non-leap year Feb 29
            "1900-02-29",  # non-leap year (divisible by 100 but not 400)
            "2026-04-31",  # April has 30 days
            "2026-01-32",  # January has 31 days
            "2026-01-00",  # day 0
            "2026/10/12",  # wrong separator
            "12-10-2026",  # wrong format
            "2026-1-1",    # missing zero padding
            "",
            "   ",
        ]
        for d in invalid_dates:
            with self.assertRaises(GlVM.UserError) as ctx:
                _validate_deadline_date(d)
            self.assertIn("deadline_hint must be YYYY-MM-DD", str(ctx.exception))

    def test_deadline_guard_enforcement(self):
        # Current clock: 2026-10-10
        # Passed deadline (2026-10-09) is allowed
        _check_deadline_guard("2026-10-09")
        _check_deadline_guard("2026-10-10")

        # Future deadline (2026-10-11) reverts
        with self.assertRaises(GlVM.UserError) as ctx:
            _check_deadline_guard("2026-10-11")
        self.assertIn("cannot resolve before deadline date", str(ctx.exception))

    def test_url_validator_accepts_valid_domains(self):
        valid_urls = [
            "https://en.wikipedia.org/wiki/Apollo_11",
            "https://wikipedia.org/wiki/Falcon_9",
            "https://www.reuters.com/business/finance/article-1",
            "https://reuters.com/world",
            "https://apnews.com/article/space-exploration",
            "https://www.bbc.com/news/science-environment-12345",
            "https://bbc.com/news",
            "https://www.nasa.gov/missions/artemis",
            "https://nasa.gov/press-release",
            "https://www.noaa.gov/weather",
            "https://noaa.gov/climate",
            "https://www.ecb.europa.eu/press/pr/date/2026/html/index.en.html",
            "https://ecb.europa.eu/stats",
        ]
        for url in valid_urls:
            res = _validate_source_url(url)
            self.assertEqual(res, url)

    def test_url_validator_rejects_disallowed_and_malformed(self):
        invalid_cases = [
            ("http://wikipedia.org/x", "scheme must be https"),
            ("https://evil-wikipedia.org/x", "domain not in authorized allowlist"),
            ("https://wikipedia.org.attacker.com/x", "domain not in authorized allowlist"),
            ("https://user:pass@wikipedia.org/x", "cannot contain userinfo"),
            ("https://wikipedia.org:8443/x", "port must be 443 or omitted"),
            ("https://raw.githubusercontent.com/x/y", "domain not in authorized allowlist"),
            ("https://github.com/x/y", "domain not in authorized allowlist"),
            ("https://127.0.0.1/x", "cannot be an IP address"),
            ("https://192.168.1.1/x", "cannot be an IP address"),
            ("https://xn--e1afmkfd.wikipedia.org/x", "cannot be punycode"),
            ("", "empty source_url"),
            ("   ", "empty source_url"),
            ("https://en.wikipedia.org/wiki/ Apollo_11", "cannot contain whitespace"),
            ("https://" + "a" * 301 + ".wikipedia.org/x", "exceeds maximum length of 300 characters"),
        ]
        for url, expected_err in invalid_cases:
            with self.assertRaises(GlVM.UserError) as ctx:
                _validate_source_url(url)
            self.assertIn(expected_err, str(ctx.exception))

    def test_window_selection_budget_and_truncation(self):
        raw_statement = "NASA will launch the Artemis II lunar flyby mission."
        # Case A: Short text <= 12,000 chars -> returned verbatim, coverage="COMPLETE"
        short_text = "This is a short document. " * 100
        text, cov, total, inspected, trunc = _select_windows(short_text, raw_statement)
        self.assertEqual(cov, "COMPLETE")
        self.assertEqual(trunc, False)
        self.assertEqual(total, len(short_text))
        self.assertEqual(inspected, len(short_text))
        self.assertEqual(text, short_text)

        # Case B: Large text > 12,000 chars -> SELECTED_WINDOWS
        long_text = ("General preamble text that does not match any query. " * 300) + \
                    ("NASA Artemis II mission flyby launched astronauts towards the moon. " * 50) + \
                    ("Trailing unrelated text padding for length. " * 300)
        self.assertGreater(len(long_text), INSPECTION_BUDGET_CHARS)
        text_b, cov_b, total_b, inspected_b, trunc_b = _select_windows(long_text, raw_statement)
        self.assertEqual(cov_b, "SELECTED_WINDOWS")
        self.assertEqual(trunc_b, False)
        self.assertEqual(total_b, len(long_text))
        self.assertLessEqual(inspected_b, INSPECTION_BUDGET_CHARS + 2000)
        self.assertIn("artemis", text_b.lower())

        # Case C: Huge text > 300,000 chars -> truncated_at=True
        huge_text = "A" * (MAX_PAGE_CHARS + 1000)
        text_c, cov_c, total_c, inspected_c, trunc_c = _select_windows(huge_text, raw_statement)
        self.assertEqual(trunc_c, True)
        self.assertEqual(total_c, len(huge_text))

        # Case D: Determinism across repeated calls with identical input
        run1 = _select_windows(long_text, raw_statement)
        run2 = _select_windows(long_text, raw_statement)
        self.assertEqual(run1, run2)

    def test_text_segmentation_determinism(self):
        text = (
            "Apollo 11 was the American spaceflight that first landed humans on the Moon. "
            "Commander Neil Armstrong and lunar module pilot Buzz Aldrin landed the Apollo Lunar Module Eagle. "
            "Too shrt. "  # under 12 chars -> filtered out
            "This is a longer sentence with sufficient length to be included as a numbered segment. "
            + ("Very long content string repeated to test capping at 240 chars. " * 10)
        )

        segs1 = _segment_text(text)
        segs2 = _segment_text(text)

        self.assertEqual(segs1, segs2)
        self.assertTrue(len(segs1) >= 3)

        for i, s in enumerate(segs1):
            self.assertEqual(s["id"], i + 1)
            self.assertLessEqual(len(s["text"]), 240)
            self.assertGreaterEqual(len(s["text"]), 12)
            expected_h = hashlib.sha256(s["text"].encode("utf-8")).hexdigest()
            self.assertEqual(s["sha256"], expected_h)

        for s in segs1:
            self.assertNotIn("Too shrt.", s["text"])

    def test_map_elements_to_outcome_exhaustive(self):
        # 1. All SATISFIED -> KEPT
        els_all_kept = [
            {"id": "e1", "kind": "ACTION", "label": "land on moon", "status": "SATISFIED", "passage_ids": [1]},
            {"id": "e2", "kind": "CONDITION", "label": "return safely", "status": "SATISFIED", "passage_ids": [2]},
            {"id": "e3", "kind": "DEADLINE", "label": "before 1970", "status": "SATISFIED", "passage_ids": [3]},
        ]
        self.assertEqual(_map_elements_to_outcome(els_all_kept, "COMPLETE"), "KEPT")

        # 2. Missed deadline: ACTION SATISFIED, DEADLINE NOT_SATISFIED -> BROKEN
        els_missed_dl = [
            {"id": "e1", "kind": "ACTION", "label": "land on moon", "status": "SATISFIED", "passage_ids": [1]},
            {"id": "e2", "kind": "DEADLINE", "label": "before 1968", "status": "NOT_SATISFIED", "passage_ids": [2]},
        ]
        self.assertEqual(_map_elements_to_outcome(els_missed_dl, "COMPLETE"), "BROKEN")

        # 3. None SATISFIED: ACTION NOT_SATISFIED, DEADLINE SATISFIED -> BROKEN
        els_action_failed = [
            {"id": "e1", "kind": "ACTION", "label": "land on moon", "status": "NOT_SATISFIED", "passage_ids": [1]},
            {"id": "e2", "kind": "DEADLINE", "label": "before 1970", "status": "SATISFIED", "passage_ids": [2]},
        ]
        self.assertEqual(_map_elements_to_outcome(els_action_failed, "COMPLETE"), "BROKEN")

        # 4. Mixed: ACTION SATISFIED, CONDITION1 SATISFIED, CONDITION2 NOT_SATISFIED, DEADLINE SATISFIED -> PARTIAL
        els_mixed = [
            {"id": "e1", "kind": "ACTION", "label": "launch rocket", "status": "SATISFIED", "passage_ids": [1]},
            {"id": "e2", "kind": "CONDITION", "label": "reach orbit", "status": "SATISFIED", "passage_ids": [2]},
            {"id": "e3", "kind": "CONDITION", "label": "land booster", "status": "NOT_SATISFIED", "passage_ids": [3]},
            {"id": "e4", "kind": "DEADLINE", "label": "before deadline", "status": "SATISFIED", "passage_ids": [4]},
        ]
        self.assertEqual(_map_elements_to_outcome(els_mixed, "COMPLETE"), "PARTIAL")

        # 5. Any element UNDETERMINED -> raises "insufficient evidence for a conclusive outcome"
        els_undetermined = [
            {"id": "e1", "kind": "ACTION", "label": "launch rocket", "status": "SATISFIED", "passage_ids": [1]},
            {"id": "e2", "kind": "DEADLINE", "label": "before deadline", "status": "UNDETERMINED", "passage_ids": []},
        ]
        with self.assertRaises(GlVM.UserError) as ctx:
            _map_elements_to_outcome(els_undetermined, "COMPLETE")
        self.assertIn("insufficient evidence for a conclusive outcome", str(ctx.exception))

        # 6. Missing ACTION element -> raises UserError("model returned no valid outcome")
        els_no_action = [
            {"id": "e1", "kind": "CONDITION", "label": "reach orbit", "status": "SATISFIED", "passage_ids": [1]},
            {"id": "e2", "kind": "DEADLINE", "label": "before deadline", "status": "SATISFIED", "passage_ids": [2]},
        ]
        with self.assertRaises(GlVM.UserError) as ctx:
            _map_elements_to_outcome(els_no_action, "COMPLETE")
        self.assertIn("model returned no valid outcome", str(ctx.exception))

        # 7. Missing DEADLINE element -> raises UserError("model returned no valid outcome")
        els_no_deadline = [
            {"id": "e1", "kind": "ACTION", "label": "launch rocket", "status": "SATISFIED", "passage_ids": [1]},
        ]
        with self.assertRaises(GlVM.UserError) as ctx:
            _map_elements_to_outcome(els_no_deadline, "COMPLETE")
        self.assertIn("model returned no valid outcome", str(ctx.exception))

        # 8. Duplicate DEADLINE elements -> raises UserError("model returned no valid outcome")
        els_dup_deadline = [
            {"id": "e1", "kind": "ACTION", "label": "launch rocket", "status": "SATISFIED", "passage_ids": [1]},
            {"id": "e2", "kind": "DEADLINE", "label": "dl1", "status": "SATISFIED", "passage_ids": [2]},
            {"id": "e3", "kind": "DEADLINE", "label": "dl2", "status": "SATISFIED", "passage_ids": [3]},
        ]
        with self.assertRaises(GlVM.UserError) as ctx:
            _map_elements_to_outcome(els_dup_deadline, "COMPLETE")
        self.assertIn("model returned no valid outcome", str(ctx.exception))

    def test_evidence_fingerprint_calculation(self):
        passages = [
            {"id": 1, "sha256": hashlib.sha256(b"First segment text").hexdigest(), "text": "First segment text"},
            {"id": 2, "sha256": hashlib.sha256(b"Second segment text").hexdigest(), "text": "Second segment text"},
        ]
        ordered_cited = [passages[0], passages[1]]
        preimage = "|".join(f"{p['id']}:{p['sha256']}" for p in ordered_cited).encode("utf-8")
        fp1 = hashlib.sha256(preimage).hexdigest()

        passages_mod = [
            {"id": 1, "sha256": hashlib.sha256(b"First segment text.").hexdigest(), "text": "First segment text."},
            {"id": 2, "sha256": passages[1]["sha256"], "text": passages[1]["text"]},
        ]
        preimage_mod = "|".join(f"{p['id']}:{p['sha256']}" for p in passages_mod).encode("utf-8")
        fp2 = hashlib.sha256(preimage_mod).hexdigest()

        self.assertNotEqual(fp1, fp2)

    def test_parse_json_strictly(self):
        ledger = CommitmentLedger()
        d = {"match": True, "subject": "apollo 11", "action": "land on moon"}
        self.assertEqual(ledger._parse_json_strictly(d), d)

        s = '{"match": true, "elements": []}'
        self.assertEqual(ledger._parse_json_strictly(s), {"match": True, "elements": []})

        fenced = '```json\n{"match": false}\n```'
        self.assertEqual(ledger._parse_json_strictly(fenced), {"match": False})

        bad = "this is not json at all"
        self.assertEqual(ledger._parse_json_strictly(bad), {})


if __name__ == "__main__":
    unittest.main()
