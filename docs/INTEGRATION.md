# Integration Guide: CommitmentLedger

This document details how client applications and future dApps can integrate with the hardened `CommitmentLedger` Intelligent Contract on GenLayer Studionet (Preview).

## Contract Coordinates

- **Network**: GenLayer Studionet (Preview)
- **Chain ID**: `61999`
- **RPC URL**: `https://studio.genlayer.com/api`
- **Explorer URL**: `https://explorer-studio.genlayer.com/address/0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB`
- **Contract Address**: `0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB`
- **genlayer-js version**: `1.1.8`
- **Chain Object**: `chains.studionet`

For earlier superseded contract deployments, see the [README](../README.md#superseded-deployments).

---

## Public Methods & View Specifications

### 1. `register_commitment(raw_text: str, deadline_hint: str, claim_kind: str, retrospective_ack: bool) -> str`

Registers a public commitment with immediate multi-validator canonical extraction of `{subject, action}`, classifying whether it is prospective or retrospective.

- **Type**: Write Transaction (Consensus)
- **Parameters**:
  - `raw_text` (`str`): The commitment statement (non-empty, <= 400 characters). Enclosed in `<UNTRUSTED_TEXT>` delimiters during processing.
  - `deadline_hint` (`str`): Mandatory strict calendar date formatted as `YYYY-MM-DD` (calendar days and leap years strictly validated).
  - `claim_kind` (`str`): `"SELF_DECLARED"` or `"THIRD_PARTY_REPORT"`.
  - `retrospective_ack` (`bool`): Set to `True` if `deadline_hint <= current_date` to catalog as `HISTORICAL_ANALYSIS`.
- **Returns**: `commitment_id` (12 hex characters string).
- **Example Call (`genlayer-js`)**:
  ```javascript
  const txHash = await client.writeContract({
    address: '0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB',
    functionName: 'register_commitment',
    args: [
      "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.",
      "1970-01-01",
      "THIRD_PARTY_REPORT",
      true
    ],
  });
  ```

---

### 2. `submit_resolution(commitment_id: str, source_url: str) -> None`

Submits an allowlisted public source URL. The contract selects highest-density windows, segments text into numbered passages, and adjudicates statement elements via comparative consensus.

- **Type**: Write Transaction (Consensus)
- **Parameters**:
  - `commitment_id` (`str`): 12-hex character ID of an open commitment.
  - `source_url` (`str`): Allowlisted HTTPS URL (<= 300 characters, no userinfo, default 443 port).
- **Consensus Behavior**:
  - Enforces `current_date >= deadline_hint`.
  - Deterministically extracts up to 12,000 chars across highest scoring 3,000-char windows.
  - Splits text into numbered sentences and computes sha256 fingerprints.
  - Decomposes statement into 2 to 6 elements (ACTION, CONDITION, DEADLINE).
  - Transition status to `PROVISIONAL` with a 600-second (10-minute) reconsideration challenge window.
- **Example Call (`genlayer-js`)**:
  ```javascript
  const txHash = await client.writeContract({
    address: '0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB',
    functionName: 'submit_resolution',
    args: [
      "98e5aceacf75",
      "https://en.wikipedia.org/wiki/Apollo_11"
    ],
  });
  ```

---

### 3. `challenge_resolution(commitment_id: str, reason: str, source_url: str) -> None`

Challenges a provisional decision during the 600-second window.

- **Parameters**:
  - `commitment_id` (`str`): 12-hex character ID in `PROVISIONAL` status.
  - `reason` (`str`): `"UNSUPPORTED_CLASSIFICATION"` (re-reviews original source with strict grounding) or `"CONFLICTING_EVIDENCE"` (presents alternative allowlisted source).
  - `source_url` (`str`): Source URL for the challenge.

---

### 4. `finalize_resolution(commitment_id: str) -> None`

Finalizes an adjudication once the 600-second challenge window elapses or the 3-decision limit is exhausted. Transitions the commitment's on-chain record status from `PROVISIONAL` to `FINAL` (while the transaction receipt reaches "FINALIZED").

- **Parameters**:
  - `commitment_id` (`str`): 12-hex character ID in `PROVISIONAL` status.

---

### 5. `get_commitment(commitment_id: str) -> str`

Retrieves a serialized JSON representation of a commitment record.

- **Type**: Read Call (View, purely read-only)
- **Parameters**: `commitment_id` (`str`).
- **Response Shape**:
  ```json
  {
    "schema_version": "3.1.0",
    "commitment_id": "98e5aceacf75",
    "registrant": "0x...",
    "raw_text": "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.",
    "subject": "us apollo 11 mission",
    "action": "land human astronauts on the lunar surface before 1970",
    "deadline_hint": "1970-01-01",
    "registration_class": "RETROSPECTIVE",
    "record_class": "HISTORICAL_ANALYSIS",
    "claim_kind": "THIRD_PARTY_REPORT",
    "identity_verified": false,
    "status": "PROVISIONAL",
    "outcome": "KEPT",
    "decisions": [ ... ]
  }
  ```

---

### 6. `get_decision_history(commitment_id: str) -> str`

Returns the complete chronological array of adjudication decisions for a commitment.

---

### 7. `list_commitments_by_registrant(registrant: str, limit: int) -> str`

Discovery view designed for frontends to list all commitments created by an address without modifying contract storage.
