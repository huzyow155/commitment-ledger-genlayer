# Design & Consensus Architecture: CommitmentLedger v3.0.0

This document describes the architectural design, trust model, and validator consensus mechanics of `CommitmentLedger` v3.0.0.

## 1. Problem: Paraphrase Vulnerability, Temporal Authenticity & Element Integrity

Public commitments (e.g. roadmap targets, steward promises, funding conditions) encounter three critical governance challenges on smart contract platforms:

1. **Paraphrase Vulnerability**: A commitment phrased as *"Apollo 11 will land human astronauts on the lunar surface before 1970"* will fail exact-string matches against historical reports like *"On July 20, 1969, Neil Armstrong and Buzz Aldrin walked on the Moon"*.
2. **Temporal Authenticity**: A claim registered after the fact (e.g., claiming in 2026 that Apollo 11 would land in 1969) is not an accountability commitment but retrospective historical analysis. Without explicit labeling, users could register already-completed events to falsify predictive accuracy.
3. **Element-by-Element Integrity**: Statements often contain compound clauses (e.g., *"Mission X will put all three astronauts on the surface"*). Summarizing statements into simple subject/action phrases risks dropping vital qualifiers (such as "all three", where only two astronauts descended while the command module pilot remained in orbit).

`CommitmentLedger` v3.0.0 addresses each of these challenges through deterministic on-chain architecture.

---

## 2. Temporal Classification & Identity Attribution

When a commitment is registered via `register_commitment(raw_text, deadline_hint, claim_kind, retrospective_ack)`:

1. **Deterministic Clock Comparison**:
   The GenVM consensus clock extracts `registered_date = now_str[:10]`.
   - If `deadline_hint > registered_date`:
     - `registration_class = "PROSPECTIVE"`
     - `record_class = "ACCOUNTABILITY"`
     - Premature resolution is refused on-chain until `current_date >= deadline_hint`.
   - If `deadline_hint <= registered_date`:
     - The registration is retrospective.
     - If `retrospective_ack == False`, reverts with `"deadline is not after registration date; set retrospective_ack to record a historical claim"`.
     - If acknowledged, sets `registration_class = "RETROSPECTIVE"` and `record_class = "HISTORICAL_ANALYSIS"`.

2. **Unverified Claim Kind**:
   Smart contract signers cannot be cryptographically linked to real-world identities without an identity oracle. To avoid false credibility:
   - Callers specify `claim_kind`: `"SELF_DECLARED"` (personal assertion) or `"THIRD_PARTY_REPORT"` (news report / document).
   - The contract explicitly sets `identity_verified = False` on every record.

---

## 3. Element-Based Adjudication & Grounded Evidence

Rather than reducing commitments to simple subject/action phrases, v3.0.0 evaluates the **full original statement** decomposed into 2 to 6 decision-critical elements:

- **ACTION Elements**: At least one element evaluating the core promised action.
- **CONDITION Elements**: Zero or more elements evaluating scope, quantities, mandatory conditions (e.g., "all three", "without civilian casualties").
- **DEADLINE Element**: Exactly one element evaluating completion on or before the calendar deadline.

### Element Mapping Matrix

| ACTION | CONDITION | DEADLINE | Outcome |
| :--- | :--- | :--- | :--- |
| SATISFIED | All SATISFIED (or none) | SATISFIED | **KEPT** |
| NOT_SATISFIED | Any | Any | **BROKEN** |
| Any | Any NOT_SATISFIED | Any | **BROKEN** |
| Any | Any | NOT_SATISFIED | **BROKEN** |
| SATISFIED | SATISFIED | UNDETERMINED | **INCONCLUSIVE** (Reverts, remains OPEN) |

### Deterministic Window Selection & Segmentation
To evaluate large documents without exceeding validator token limits:
1. `_select_windows()` scores overlapping 3,000-character windows based on keyword density from the statement, selecting up to 12,000 characters.
2. `_segment_text()` deterministically splits inspected text into numbered sentences (capped at 240 chars each).
3. Each cited segment generates a SHA-256 fingerprint anchored to the transaction receipt.

---

## 4. Bounded Challenge & Reconsideration State Machine

When `submit_resolution` resolves a commitment:
1. The commitment enters **`PROVISIONAL`** status with a 24-hour challenge deadline (`challenge_deadline_ts = current_ts + 86400`).
2. During the 24-hour window, any party may call `challenge_resolution(commitment_id, reason, source_url)`:
   - **`UNSUPPORTED_CLASSIFICATION`**: Re-evaluates the original source with strict grounding requirements. If any element lacks grounded evidence, the provisional decision is **WITHDRAWN** and the commitment reverts to `OPEN`.
   - **`CONFLICTING_EVIDENCE`**: Evaluates an alternative allowlisted source URL. If it yields a conflicting outcome, the record marks `outcome = "DISPUTED"`.
3. **Decision Budget**: A maximum of 3 decisions (`MAX_DECISIONS = 3`) can be recorded. Once 3 decisions are reached or the 24-hour window expires, anyone can call `finalize_resolution(commitment_id)` to permanently seal status as `FINAL`.

---

## 5. Consensus Equivalence Mechanics

GenLayer Studionet validators execute `gl.eq_principle.prompt_comparative` on semantic outcome agreement:
- Leaders evaluate the source and generate the full structured element JSON and SHA-256 fingerprints.
- Validators independently evaluate the prompt and verify agreement on the overall outcome (`KEPT`, `BROKEN`, `PARTIAL`, or `WITHDRAWN`) and topic match.
- This prevents minor token-level variances in free text from triggering false `EQUIVALENCE_PRINCIPLE_VIOLATION` while maintaining decentralized verification.
