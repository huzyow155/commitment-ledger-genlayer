# Design & Consensus Architecture: CommitmentLedger v3.1.0

This document describes the architectural design, trust model, and validator consensus mechanics of `CommitmentLedger` v3.1.0.

## 1. Problem: Paraphrase Vulnerability, Temporal Authenticity & Element Integrity

Public commitments (e.g. roadmap targets, steward promises, funding conditions) encounter three critical governance challenges on smart contract platforms:

1. **Paraphrase Vulnerability**: A commitment phrased as *"Apollo 11 will land human astronauts on the lunar surface before 1970"* will fail exact-string matches against historical reports like *"On July 20, 1969, Neil Armstrong and Buzz Aldrin walked on the Moon"*.
2. **Temporal Authenticity**: A claim registered after the fact (e.g., claiming in 2026 that Apollo 11 would land in 1969) is not an accountability commitment but retrospective historical analysis. Without explicit labeling, users could register already-completed events to falsify predictive accuracy.
3. **Element-by-Element Integrity**: Statements often contain compound clauses (e.g., *"Mission X will put all three astronauts on the surface"*). Summarizing statements into simple subject/action phrases risks dropping vital qualifiers (such as "all three", where only two astronauts descended while the command module pilot remained in orbit).

`CommitmentLedger` v3.1.0 addresses each of these challenges through deterministic on-chain architecture.

---

## 2. Temporal Classification & Identity Attribution

When a commitment is registered via `register_commitment(raw_text, deadline_hint, claim_kind, retrospective_ack)`:

1. **Deterministic UTC Clock Derivation**:
   The GenVM consensus clock extracts `gl.message_raw["datetime"]` parsed strictly into UTC timestamp and normalized `YYYY-MM-DD` date string (`_parse_iso8601_utc`), immune to local timezone string slicing.
   - If `deadline_hint > registered_date`:
     - `registration_class = "PROSPECTIVE"`
     - `record_class = "ACCOUNTABILITY"`
     - Premature resolution is refused on-chain until `current_date >= deadline_hint`.
   - If `deadline_hint <= registered_date`:
     - The registration is retrospective.
     - If `retrospective_ack == False`, reverts with `"deadline is not after registration date; set retrospective_ack to record a historical claim"`.
     - If acknowledged, sets `registration_class = "RETROSPECTIVE"` and `record_class = "HISTORICAL_ANALYSIS"`.

2. **Unverified Claim Kind**:
   Smart contract signers cannot be verified against real-world identities without an identity oracle. To avoid false credibility:
   - Callers specify `claim_kind`: `"SELF_DECLARED"` (personal assertion) or `"THIRD_PARTY_REPORT"` (news report / document).
   - The contract explicitly sets `identity_verified = False` on every record.
   - Validation occurs before storage initialization, preventing nonce or storage mutation on revert.

---

## 3. Element-Based Adjudication & Grounded Evidence

Rather than reducing commitments to simple subject/action phrases, v3.1.0 evaluates the **full original statement** decomposed into 2 to 6 decision-critical elements:

- **ACTION Elements**: At least one element evaluating the core promised action.
- **CONDITION Elements**: Zero or more elements evaluating scope, quantities, mandatory conditions (e.g., "all three", "without civilian casualties").
- **DEADLINE Element**: Exactly one element evaluating completion on or before the calendar deadline.

### Element Mapping Truth Table

| Condition | Outcome | Description |
| :--- | :--- | :--- |
| Any element is `NOT_SATISFIED` | **`BROKEN`** | Any contradicted condition or missed deadline breaks the commitment. |
| All elements are `SATISFIED` | **`KEPT`** | Full satisfaction of all actions, conditions, and deadline. |
| At least one `SATISFIED` and none `NOT_SATISFIED` | **`PARTIAL`** | At least one confirmed element with remaining elements undetermined. |
| All elements are `UNDETERMINED` | **`INCONCLUSIVE`** | Reverts with `"insufficient evidence for a conclusive outcome"`; commitment remains `OPEN`. |

### Deterministic Window Selection & Segment Citation
To evaluate large documents without exceeding validator token limits:
1. `_clean_html()` strips script, style, navigation, headers, footers, HTML tags, unescapes entities, and collapses whitespace.
2. `_select_windows()` scores overlapping 3,000-character windows based on keyword density, strictly counting join separators within the 12,000-character budget (`len(inspected_text) <= 12000`).
3. `_segment_text()` deterministically splits inspected text into numbered sentences (capped at 240 chars each).
4. The exact set of segments visible to the model is fingerprinted and recorded on-chain (`presented_segment_ids`, `presented_segments_count`, `truncated_at`, `budget_chars_used`).
5. All model citations are strictly verified against `presented_segment_ids`. Any citation outside the presented set causes immediate rejection (`model returned no valid outcome`).

---

## 4. Bounded Challenge & Reconsideration State Machine

When `submit_resolution` resolves a commitment:
1. The commitment enters **`PROVISIONAL`** status with a 600-second challenge deadline (`CHALLENGE_WINDOW_SECONDS = 600`, `challenge_deadline_ts = current_ts + 600`).
2. During the 600-second window, any party may call `challenge_resolution(commitment_id, reason, source_url)`:
   - **`UNSUPPORTED_CLASSIFICATION`**: Re-evaluates the original source with strict grounding requirements. If any element lacks grounded evidence, the provisional decision is **WITHDRAWN** and the commitment reverts to `OPEN`.
   - **`CONFLICTING_EVIDENCE`**: Evaluates an alternative allowlisted source URL. If it yields a conflicting outcome, the record marks `outcome = "DISPUTED"`.
3. `current_decision_index` is dynamically computed as `len(record["decisions"]) - 1` across all resolutions and challenges.
4. **Finalization Branches**:
   Calling `finalize_resolution(commitment_id)` seals the commitment record status as **`FINAL`** via one of two distinct, intended branches:
   - **Challenge Window Branch (`window_elapsed = current_ts >= challenge_deadline_ts`)**: If fewer than 3 decisions were made (e.g. 1 initial decision, or 1 initial + 1 challenge), the caller must wait until the full 600-second challenge window elapses on the consensus clock. Early finalization attempts revert with `"challenge window still open"`.
   - **Decision Budget Branch (`budget_exhausted = len(decisions) >= MAX_DECISIONS`)**: When the decision cap (`MAX_DECISIONS = 3`) is reached, no further challenge is possible under contract rules. Therefore, finalization is allowed immediately without waiting for the challenge window to expire.
   - Any subsequent call to `finalize_resolution` or `submit_resolution` on a `FINAL` record reverts.

---

## 5. Consensus Equivalence Mechanics & SDK Inspection

### Pinned SDK Environment
Contract header dependencies pin runner package:
`# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }`

Inspection of the cached runner archive (`v0.3.0-rc7`) reveals that `py-genlayer` maps to `py-lib-genlayer-std:11rhn002yfajawsz7fai6mykznbxkxs6l91iskj5cm82c92qhy3v`:
- `genlayer/gl/eq_principle.py`:
  - `strict_eq[T: calldata.Decoded](fn: typing.Callable[[], T]) -> Lazy[T]`
  - `prompt_comparative[T: calldata.Decoded](fn: typing.Callable[[], T], principle: str) -> Lazy[T]`
  - `prompt_non_comparative(fn: typing.Callable[[], str], *, task: str, criteria: str) -> Lazy[str]`
- `genlayer/gl/vm.py`:
  - `spawn_sandbox[T: calldata.Decoded](fn: typing.Callable[[], T], *, allow_write_ops: bool = False) -> Lazy[Return[T] | VMError | UserError]`
  - `run_nondet_unsafe[T: calldata.Decoded](leader_fn: typing.Callable[[], T], validator_fn: typing.Callable[[Result], bool], /) -> Lazy[T]`
  - `run_nondet[T: calldata.Decoded](leader_fn: typing.Callable[[], T], validator_fn: typing.Callable[[Result[T]], bool], /, *, compare_user_errors=..., compare_vm_errors=...) -> Lazy[T]`
  - `unpack_result[T: calldata.Decoded](res: Result[T], /) -> T`
  - Types: `Return[T]`, `VMError`, `UserError`, `Result[T]`

### What `prompt_comparative` Enforces
Under `genlayer.gl.eq_principle.prompt_comparative(fn, principle)`:
1. The validator re-executes `fn()` inside a sandbox VM.
2. The leader calldata result and validator result are formatted into text strings (`leader_answer`, `validator_answer`).
3. An LLM prompt template (`EqComparative`) evaluates whether `validator_answer` is equivalent to `leader_answer` under the principle string.
4. `prompt_comparative` compares the leader and validator results with a model-judged principle over the outcome and fingerprint text; it does not itself independently recompute fingerprints or enforce byte-level equality.

---

## 6. Future Hardening: Independent Custom Validator Verification

While v3.1.0 uses `prompt_comparative`, the GenVM SDK exposes `gl.vm.run_nondet(leader_fn, validator_fn)` in `genlayer.gl.vm`, which enables a custom leader/validator consensus architecture for future versions:

- **Leader Role**:
  `leader_fn()` fetches external web data via `gl.nondet.web.render(source_url, mode="text")`, normalizes HTML text, selects windows within the character budget, invokes the LLM prompt for element decomposition and citations, computes the SHA-256 fingerprint of the fetched body, and returns the structured decision record.

- **Validator Independent Verification**:
  Instead of relying on an LLM to compare leader and validator prose, `validator_fn(leaders_res: vm.Result)` can execute fully deterministic independent checks in Python:
  1. **Independent Web Fetch**: Re-fetch the target URL using `gl.nondet.web.get(url)`.
  2. **Deterministic Fingerprint Matching**: Recompute `hashlib.sha256(html.encode("utf-8")).hexdigest()` and verify that `leaders_res.calldata["source_fingerprint"] == my_computed_fingerprint`.
  3. **Verbatim Quotation Proof**: For each cited passage in `element_reviews`, verify that the quoted string appears verbatim as an exact substring of the downloaded text.
  4. **Deterministic Outcome Mapping**: Re-run `_map_elements_to_outcome()` on the element statuses to guarantee the final outcome follows the deterministic truth table without model deviation.
