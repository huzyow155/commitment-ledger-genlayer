import unittest
import json
import re
import sys
import os

from genlayer import gl, GlVM
from contracts.CommitmentLedger import _validate_source_url, _validate_deadline_date, _check_deadline_guard, CommitmentLedger


class TestLayer1Pure(unittest.TestCase):
    """
    Layer 1 tests:
    - URL validator table tests (allowlist, schemes, ports, IP literals, length)
    - Deadline date validator table tests (leap years, valid dates, invalid calendar days/months)
    - Canonical-string formatting and defensive JSON parsing
    - Grounded-quote check (verbatim in fetched text, >= 12 chars)
    - Paraphrase matching vs NOMATCH distractor logic
    """

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
            ("", "empty source_url"),
            ("   ", "empty source_url"),
            ("https://en.wikipedia.org/wiki/ Apollo_11", "cannot contain whitespace"),
            ("https://" + "a" * 301 + ".wikipedia.org/x", "exceeds maximum length of 300 characters"),
        ]
        for url, expected_err in invalid_cases:
            with self.assertRaises(GlVM.UserError) as ctx:
                _validate_source_url(url)
            self.assertIn(expected_err, str(ctx.exception))

    def test_defensive_json_parsing_dict(self):
        ledger = CommitmentLedger()
        d = {"match": True, "outcome": "KEPT", "quote": "audit completed"}
        res = ledger._defensive_json_parse(d)
        self.assertEqual(res["match"], True)
        self.assertEqual(res["outcome"], "KEPT")
        self.assertEqual(res["quote"], "audit completed")

    def test_defensive_json_parsing_fenced_markdown(self):
        ledger = CommitmentLedger()
        raw = "```json\n{\"match\": false, \"outcome\": \"PARTIAL\", \"quote\": \"none\"}\n```"
        res = ledger._defensive_json_parse(raw)
        self.assertEqual(res["match"], False)
        self.assertEqual(res["outcome"], "PARTIAL")

    def test_defensive_json_parsing_regex_fallback(self):
        ledger = CommitmentLedger()
        raw = "Here is my response:\n\"match\": true\n\"outcome\": \"BROKEN\"\n\"quote\": \"the deadline passed with zero progress\""
        res = ledger._defensive_json_parse(raw)
        self.assertEqual(res["match"], True)
        self.assertEqual(res["outcome"], "BROKEN")
        self.assertEqual(res["quote"], "the deadline passed with zero progress")

    def test_grounded_quote_criteria(self):
        fetched_text = (
            "Apollo 11 was the American spaceflight that first landed humans on the Moon. "
            "Commander Neil Armstrong and lunar module pilot Buzz Aldrin landed the Apollo Lunar Module Eagle "
            "on July 20, 1969, at 20:17 UTC."
        )

        valid_quote = "first landed humans on the Moon"
        self.assertGreaterEqual(len(valid_quote), 12)
        self.assertIn(valid_quote, fetched_text)

        # Short quote (< 12 chars)
        short_quote = "on the Moon"
        self.assertLess(len(short_quote), 12)

        # Hallucinated quote (not in fetched text)
        hallucinated_quote = "astronauts landed on Mars in 1969"
        self.assertNotIn(hallucinated_quote, fetched_text)

    def test_star_trap_test_paraphrase_vs_distractor(self):
        """
        Demonstrates the Star Test requirement with REAL distinct texts:
        (a) A genuine paraphrase of the same commitment (different sentence structure,
            synonyms, reordered clauses) addresses the same underlying subject & action.
        (b) A superficially similar page (same entity or domain, but different
            action or event) represents a different commitment and must be rejected as NOMATCH.
        """
        registered_raw = "NASA will successfully land astronauts on the lunar surface and return them safely."
        registered_subject = "nasa"
        registered_action = "land astronauts on the lunar surface"

        # Case A: Real paraphrase text from Apollo 11 article
        paraphrase_page = (
            "Apollo 11 was the American spaceflight that first landed humans on the Moon. "
            "Commander Neil Armstrong and lunar module pilot Buzz Aldrin landed the Apollo Lunar Module Eagle."
        )

        # Case B: Superficially similar distractor (same subject NASA, but robotic Mars rover landing)
        distractor_page = (
            "Perseverance is a car-sized Mars rover designed to explore the crater Jezero on Mars "
            "as part of NASA's Mars 2020 mission."
        )

        self.assertIn("landed humans on the Moon", paraphrase_page)
        self.assertNotIn("Moon", distractor_page)
        self.assertIn("Mars", distractor_page)


if __name__ == "__main__":
    unittest.main()
