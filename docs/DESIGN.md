# Design & Consensus Architecture: CommitmentLedger

This document describes the architectural design and validator consensus mechanics of `CommitmentLedger`.

## 1. Problem: The Paraphrase-Dodging Vulnerability

Public commitments (e.g. roadmap milestones, steward promises, funding conditions) are commonly restated or dodged using semantic shifts:
- A speaker states: *"We will release our main audited token contract by Q3."*
- If evaluated by naive exact string/hash comparison, the check fails when evidence refers to: *"In September, the audited token smart contract was successfully launched."*
- If evaluated by free-form, unconstrained LLM prompts, non-deterministic phrasing causes validators to diverge, failing consensus (`EQUIVALENCE_PRINCIPLE_VIOLATION`).
- If evaluated without strict subject/action bounds, superficially-similar actions (e.g. *"In September, the team launched a preview faucet"*) might get falsely credited.

## 2. Storage Architecture

`CommitmentLedger` holds **no funds**, requires **no staking/slashing**, and stores purely string-serialized canonical JSON in `TreeMap[str, str]` mapping `commitment_id` to its record:

```json
{
  "schema_version": "1.0.0",
  "commitment_id": "a3b1c9f4d2e5",
  "registrant": "0xE48D8DcAe366A5C16536c5A48aF99cBEF695f5b0",
  "raw_text": "We will ship the audited staking contract by Q3 2026.",
  "deadline_hint": "2026-09-30",
  "subject": "team",
  "action": "ship audited staking contract",
  "created_round": 104,
  "status": "OPEN",
  "outcome": null,
  "resolution_evidence": null,
  "resolution_quote": null,
  "match_confirmed": false
}
```

- In `__init__`, we declare `commitments: TreeMap[str, str]` and `commitment_ids: list[str]`. Storage variables are never assigned `TreeMap()` in `__init__`.
- `commitment_id` is derived deterministically as the first 12 hex characters of:
  `hashlib.sha256(f"{registrant}|{raw_text}|{nonce}".encode("utf-8")).hexdigest()[:12]`.

## 3. Two-Phase Consensus Design

### Phase 1: Canonical Extraction at Registration
Instead of deferring extraction to resolution time, `register_commitment` extracts canonical predicates immediately via multi-validator consensus:
1. Validator prompt extracts `{ "subject": "<lowercase short phrase>", "action": "<lowercase normalized action>" }`.
2. Returned canonical string is formatted as: `"EXTRACT|<normalized_subject>|<normalized_action>"`.
3. Deterministic code parses this string and persists it in the record.

### Phase 2: Semantic Match and Grounded Outcome at Resolution
Anyone can submit resolution evidence via `submit_resolution(commitment_id, evidence_text)`:
1. **State checks (deterministic)**:
   - Commitment must exist (`status: OPEN`).
   - If already `RESOLVED`, raises `gl.vm.UserError("commitment already resolved")`.
   - Evidence text must not be empty and within length limits (<= 1500 chars).
2. **Untrusted Data Boundary**:
   - Evidence text is enclosed in strict `<UNTRUSTED_EVIDENCE>...</UNTRUSTED_EVIDENCE>` delimiters.
   - LLMs are instructed that everything within the delimiters is untrusted data, never instructions.
3. **Canonical Consensus Output**:
   The LLM determines:
   - `match`: Does the evidence address the SAME commitment (`stored_subject` and `stored_action`)? (Boolean).
   - If `match == false`, returns canonical string: `"NOMATCH|NONE|NONE"`.
   - If `match == true`:
     - `outcome`: `KEPT` | `BROKEN` | `PARTIAL`
     - `quote`: A verbatim quote (<= 160 chars) from the untrusted evidence supporting the verdict.
     - Deterministic code validates the quote:
       - Quote length must be >= 12 chars.
       - Quote must exist verbatim in `evidence_text`.
       - If either fails, `quote_valid = false` and outcome is forced to `PARTIAL`.
     - Returns canonical string: `"MATCH|<OUTCOME>|<QUOTE_FLAG>"` where `QUOTE_FLAG` is `VALID` or `INVALID`.
4. **Validator Equivalence (`gl.eq_principle.strict_eq`)**:
   - Validators run the closure and return the flat canonical string.
   - `strict_eq` requires identical strings across majority validators.
5. **Deterministic Outcome Application**:
   - If canonical string is `"NOMATCH|NONE|NONE"`:
     Contract raises `gl.vm.UserError("evidence does not match this commitment")`.
     No outcome is written to storage, and commitment remains `OPEN`.
   - If canonical string is `"MATCH|...|..."`:
     Record is updated to `status: "RESOLVED"`, `outcome`, `match_confirmed: true`, `resolution_quote`, and `resolution_evidence`.

## 4. The Trap Test Guarantee

1. **Paraphrase Match**: When evidence uses different sentence structure, synonyms, and reordered clauses to describe the original action, the prompt instructs the model to compare semantic predicates. The validator returns `MATCH`, successfully linking the resolution.
2. **Superficial Similarity Rejection**: When evidence describes the same subject performing a different action or failing an unrelated deadline, the validator returns `NOMATCH`. The contract raises a `UserError`, preserving the open commitment.
