# Design & Consensus Architecture: CommitmentLedger

This document describes the architectural design, trust model, and validator consensus mechanics of `CommitmentLedger`.

## 1. Problem: The Paraphrase-Dodging Vulnerability & Caller Circularity

Public commitments (e.g. roadmap milestones, steward promises, funding conditions) are commonly restated or dodged using semantic shifts:
- A speaker states: *"We will release our main audited token contract by Q3."*
- If evaluated by naive exact string/hash comparison, the check fails when evidence refers to: *"In September, the audited token smart contract was successfully launched."*
- If evaluated by free-form, unconstrained LLM prompts, non-deterministic phrasing causes validators to diverge, failing consensus (`EQUIVALENCE_PRINCIPLE_VIOLATION`).
- If evaluated without strict subject/action bounds, superficially-similar actions (e.g. *"In September, the team launched a preview faucet"*) might get falsely credited.

### The Problem with Caller-Supplied Evidence
In naive implementations where callers supply free-form evidence text directly:
- The "grounded quote" check only proves the quote appears inside text that the caller wrote, which is circular.
- A registrant could self-certify `KEPT` using self-authored text.
- A malicious party could front-run an open commitment with self-authored text claiming `BROKEN`.

To eliminate this vulnerability, `CommitmentLedger` implements **Option A (Source-Based Resolution)**: resolutions must provide an allowlisted public source URL that the contract itself fetches through GenLayer's nondeterministic web environment (`gl.nondet.web.render`).

## 2. Storage Architecture

`CommitmentLedger` holds **no funds**, requires **no staking/slashing**, and stores purely string-serialized canonical JSON in `TreeMap[str, str]` mapping `commitment_id` to its record:

```json
{
  "schema_version": "2.0.0",
  "commitment_id": "8a63544a69ae",
  "registrant": "0x4aA4504eE1540949001e7cE94C1245ba40710980",
  "raw_text": "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.",
  "deadline_hint": "none",
  "subject": "apollo 11 mission",
  "action": "land human astronauts on the lunar surface before 1970",
  "created_round": 2,
  "status": "RESOLVED",
  "outcome": "KEPT",
  "source_url": "https://en.wikipedia.org/wiki/Apollo_11",
  "resolution_quote": "Apollo 11 (July 16–24, 1969) was the American spaceflight that first landed humans on the Moon",
  "match_confirmed": true,
  "resolved_at": "2026-10-11T16:29:21.702264Z",
  "resolver": "0x4aA4504eE1540949001e7cE94C1245ba40710980"
}
```

- In `__init__`, we declare `commitments: TreeMap[str, str]` and `meta: TreeMap[str, str]`. Storage variables are never assigned `TreeMap()` in `__init__`.
- `commitment_id` is derived deterministically as the first 12 hex characters of:
  `hashlib.sha256(f"{registrant}|{raw_text}|{nonce}".encode("utf-8")).hexdigest()[:12]`.

## 3. Two-Phase Consensus Design

### Phase 1: Canonical Extraction at Registration
`register_commitment(raw_text, deadline_hint)`:
1. Validates `raw_text` (<= 400 chars, pure ASCII).
2. Wraps input inside strict `<UNTRUSTED_TEXT>` delimiters with explicit instructions that content is untrusted data, preventing prompt injection attacks.
3. Multi-validator consensus extracts `{ "subject": "<phrase>", "action": "<phrase>" }`.
4. Canonical string returned to `strict_eq`: `"EXTRACT|<subject>|<action>"`.

### Phase 2: Source-Based Semantic Match & Outcome Verification
Anyone can call `submit_resolution(commitment_id, source_url)`:
1. **URL Validation (Deterministic)**:
   - Evaluated strictly using `urllib.parse.urlsplit`.
   - Scheme must be `https`.
   - No userinfo, default port 443 only.
   - Domain must belong to the fixed allowlist: `wikipedia.org`, `reuters.com`, `apnews.com`, `bbc.com`, `nasa.gov`, `noaa.gov`, `ecb.europa.eu`.
   - Rejects IP literals, punycode, whitespace, and URLs > 300 characters.
2. **Deadline Date Guard**:
   - If `deadline_hint` is formatted as an ISO date (`YYYY-MM-DD`), the contract enforces that `current_date >= deadline_date` using `gl.message_raw["datetime"]`.
3. **Web Retrieval (Nondeterministic)**:
   - Validators execute `gl.nondet.web.render(source_url, mode="text")` with fallback to `gl.nondet.web.get`.
   - Truncates retrieved text to a fixed bound (first 6,000 characters).
   - If text is empty or fetch fails, raises `gl.vm.UserError("source fetch failed")`, keeping the commitment `OPEN`.
4. **Semantic Adjudication**:
   - Retrieved text is enclosed in `<UNTRUSTED_SOURCE>` delimiters.
   - The LLM determines if the source semantically matches the commitment (`MATCH` vs `NOMATCH`).
   - If `NOMATCH`, returns canonical string `"NOMATCH|NONE|NONE"`.
   - If `MATCH`, classifies outcome (`KEPT`, `BROKEN`, `PARTIAL`) and extracts a quote (<= 160 chars).
   - Deterministic quote check: length >= 12 chars and verbatim in the fetched text. Ungrounded quotes force `PARTIAL`.
5. **Consensus Equivalence (`gl.eq_principle.strict_eq`)**:
   - Compares flat canonical string across validators.
   - If `"NOMATCH"`, raises `gl.vm.UserError("evidence does not match this commitment")` with zero storage state mutation.
   - If `"MATCH"`, updates record status to `RESOLVED` with outcome, quote, timestamp, and resolver address.
