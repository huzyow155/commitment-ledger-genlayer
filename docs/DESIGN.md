# Design & Consensus Architecture: CommitmentLedger

This document describes the architectural design, trust model, and validator consensus mechanics of `CommitmentLedger`.

## 1. Problem: Paraphrase Vulnerability & Caller Circularity

Public commitments (e.g. roadmap targets, steward promises, funding conditions) are commonly restated or dodged using semantic shifts:
- A speaker states: *"We will release our main audited token contract by Q3."*
- If evaluated by naive exact string/hash comparison, the check fails when evidence refers to: *"In September, the audited token smart contract was successfully launched."*
- If evaluated by free-form, unconstrained LLM prompts, non-deterministic phrasing causes validators to diverge, failing consensus (`EQUIVALENCE_PRINCIPLE_VIOLATION`).
- If evaluated without strict subject/action bounds, superficially-similar actions (e.g. *"In September, the team launched a preview faucet"*) might get falsely credited.

### The Problem with Caller-Supplied Evidence
In naive implementations where callers supply free-form evidence text directly:
- The "grounded quote" check only proves the quote appears inside text that the caller wrote, which is circular.
- A registrant could self-certify `KEPT` using self-authored text.
- A malicious party could front-run an open commitment with self-authored text claiming `BROKEN`.

To eliminate this vulnerability, `CommitmentLedger` implements **Source-Based Resolution**: resolutions must provide an allowlisted public source URL that the contract itself fetches through GenLayer's nondeterministic web environment (`gl.nondet.web.render`).

## 2. Storage Architecture

`CommitmentLedger` holds **no funds**, requires **no staking/slashing**, and stores purely string-serialized canonical JSON in `TreeMap[str, str]` mapping `commitment_id` to its record:

```json
{
  "schema_version": "2.2.0",
  "commitment_id": "1fe69a47c557",
  "registrant": "0x71B47328E05e68875cBc203a1B4d04fA2A0965B6",
  "raw_text": "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.",
  "deadline_hint": "1970-01-01",
  "subject": "apollo 11 mission",
  "action": "land human astronauts on the lunar surface before 1970",
  "created_round": 1,
  "status": "RESOLVED",
  "outcome": "KEPT",
  "source_url": "https://en.wikipedia.org/wiki/Apollo_11",
  "resolution_quote": "Apollo 11 (July 16–24, 1969) was the American spaceflight that first landed humans on the Moon",
  "match_confirmed": true,
  "resolved_at": "2026-10-11T17:51:14.230481Z",
  "resolver": "0x71B47328E05e68875cBc203a1B4d04fA2A0965B6"
}
```

- In `__init__`, we declare `commitments: TreeMap[str, str]` and `meta: TreeMap[str, str]`. Storage variables are never assigned `TreeMap()` in `__init__`.
- `commitment_id` is derived deterministically as the first 12 hex characters of:
  `hashlib.sha256(f"{registrant}|{raw_text}|{nonce}".encode("utf-8")).hexdigest()[:12]`.

## 3. Two-Phase Consensus Design

### Phase 1: Canonical Extraction at Registration
`register_commitment(raw_text, deadline_hint)`:
1. Validates `raw_text` (<= 400 chars, pure ASCII).
2. Validates `deadline_hint` as a strict calendar date in `YYYY-MM-DD` format with leap year checks (rejects invalid dates like "end of Q2" with `gl.vm.UserError("deadline_hint must be YYYY-MM-DD")`).
3. Wraps input inside strict `<UNTRUSTED_TEXT>` delimiters with explicit instructions that content is untrusted data, preventing prompt injection attacks.
4. Multi-validator consensus extracts `{ "subject": "<phrase>", "action": "<phrase>" }`.
5. Canonical string returned to `strict_eq`: `"EXTRACT|<subject>|<action>"`.

### Phase 2: Source-Based Semantic Match & Outcome Verification
Anyone can call `submit_resolution(commitment_id, source_url)`:
1. **URL Validation (Deterministic)**:
   - Evaluated strictly using `urllib.parse.urlsplit`.
   - Scheme must be `https`.
   - No userinfo, default port 443 only.
   - Domain must belong to the fixed allowlist: `wikipedia.org`, `reuters.com`, `apnews.com`, `bbc.com`, `nasa.gov`, `noaa.gov`, `ecb.europa.eu`.
   - Rejects IP literals, punycode, whitespace, and URLs > 300 characters.
2. **Deterministic Deadline Guard**:
   - Enforces `current_date >= deadline_hint` using deterministic clock `gl.message_raw["datetime"]`.
   - If earlier, raises `gl.vm.UserError("cannot resolve before deadline date")`. If clock is missing or invalid, raises `gl.vm.UserError("clock unavailable")`.
3. **Web Retrieval (Nondeterministic)**:
   - Validators execute `gl.nondet.web.render(source_url, mode="text")` with fallback to `gl.nondet.web.get`.
   - Truncates retrieved text to a fixed bound (first 6,000 characters).
   - If text is empty or fetch fails, raises `gl.vm.UserError("source fetch failed")`, keeping the commitment `OPEN`.
4. **Resolution Check Order (Strict Non-Overlapping Cascade)**:
   - Evaluates retrieved source in `<UNTRUSTED_SOURCE>` block against registered `{subject, action}`.
   - **Step 4a (`NOMATCH`)**: If source text describes an unrelated subject or different event, returns `"NOMATCH|NONE|NONE"`. Reverts with `"source does not match this commitment"`, commitment stays `OPEN`.
   - **Step 4b (`INVALID`)**: If the model matches the topic but fails to produce a valid outcome (`KEPT`, `BROKEN`, or `PARTIAL`), returns `"INVALID|NONE|NONE"`. Reverts with `"model returned no valid outcome"`, commitment stays `OPEN`.
   - **Step 4c (`UNGROUNDED`)**: If the model asserts an outcome but the quote is under 12 characters or not a verbatim substring of the first 6,000 characters, returns `"UNGROUNDED|NONE|NONE"`. Reverts with `"no grounded quote in source"`, commitment stays `OPEN`.
   - **Step 4d (`MATCH`)**: If matched, valid outcome, and grounded quote verified, returns `"MATCH|<outcome>|<quote>"`.
5. **Consensus Equivalence (`gl.eq_principle.strict_eq`)**:
   - Compares flat canonical string across validators.
   - If `"NOMATCH"`, raises `gl.vm.UserError("source does not match this commitment")` with zero storage state mutation.
   - If `"INVALID"`, raises `gl.vm.UserError("model returned no valid outcome")` with zero storage state mutation.
   - If `"UNGROUNDED"`, raises `gl.vm.UserError("no grounded quote in source")` with zero storage state mutation.
   - If `"MATCH"`, updates record status to `RESOLVED` with outcome, quote, timestamp, and resolver address. Permanent and irreversible.
