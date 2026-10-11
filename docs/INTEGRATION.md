# Integration Guide: CommitmentLedger

This document details how client applications and future dApps can integrate with the `CommitmentLedger` Intelligent Contract on GenLayer studionet.

## Contract Coordinates

- **Network**: GenLayer Studionet (Preview)
- **Chain ID**: `61999`
- **RPC URL**: `https://studio.genlayer.com/api`
- **Explorer URL**: `https://explorer-studio.genlayer.com/address/0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3`
- **Contract Address**: `0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3`
- **genlayer-js version**: `1.1.8`
- **Chain Object**: `chains.studionet`

---

## Public Methods & View Specifications

### 1. `register_commitment(raw_text: str, deadline_hint: str) -> str`

Registers a public commitment with immediate multi-validator canonical extraction of `{subject, action}`.

- **Type**: Write Transaction (Consensus)
- **Parameters**:
  - `raw_text` (`str`): The commitment statement (non-empty, <= 400 characters).
  - `deadline_hint` (`str`): Target date or milestone description (<= 60 characters).
- **Returns**: `commitment_id` (12 hex characters string).
- **Measured Latency**: 15.76s – 35.34s.
- **Example Call (`genlayer-js`)**:
  ```javascript
  const txHash = await client.writeContract({
    address: '0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3',
    functionName: 'register_commitment',
    args: [
      "Hyper commits to ship the decentralized commitment ledger on studionet by Q4 2026.",
      "2026-12-31"
    ],
  });
  ```

---

### 2. `submit_resolution(commitment_id: str, evidence_text: str) -> None`

Submits natural language evidence to evaluate whether an open commitment was kept, broken, or partially fulfilled.

- **Type**: Write Transaction (Consensus)
- **Parameters**:
  - `commitment_id` (`str`): 12-hex character ID of an open commitment.
  - `evidence_text` (`str`): Untrusted evidence text (non-empty, <= 1500 characters).
- **Consensus Behavior**:
  - Evaluates semantic equivalence against registered `{subject, action}`.
  - If evidence does not match, transaction fails with user error: `"evidence does not match this commitment"`.
  - If match is confirmed, classifies outcome (`KEPT`, `BROKEN`, `PARTIAL`).
  - Verifies grounded verbatim quote (>= 12 chars). An ungrounded quote forces `PARTIAL`.
- **Measured Latency**: 15.73s – 25.75s.
- **Example Call (`genlayer-js`)**:
  ```javascript
  const txHash = await client.writeContract({
    address: '0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3',
    functionName: 'submit_resolution',
    args: [
      "2179cd4d54f1",
      "Public announcement: As of October 2026, Hyper has successfully deployed and verified the decentralized commitment ledger intelligent contract on GenLayer studionet."
    ],
  });
  ```

---

### 3. `get_commitment(commitment_id: str) -> str`

Retrieves a serialized JSON representation of a commitment record.

- **Type**: Read Call (View)
- **Parameters**: `commitment_id` (`str`).
- **Response Shape**:
  ```json
  {
    "schema_version": "1.0.0",
    "commitment_id": "2179cd4d54f1",
    "registrant": "0xA78a710A56eE6526226E5AC1903427df2680d9Bc",
    "raw_text": "Hyper commits to ship the decentralized commitment ledger on studionet by Q4 2026.",
    "subject": "hyper",
    "action": "ship decentralized commitment ledger on studionet by q4 2026",
    "deadline_hint": "2026-12-31",
    "created_round": 1,
    "status": "RESOLVED",
    "outcome": "KEPT",
    "resolution_evidence": "Public announcement: As of October 2026, Hyper has successfully deployed and verified the decentralized commitment ledger intelligent contract on GenLayer studionet.",
    "resolution_quote": "Hyper has successfully deployed and verified the decentralized commitment ledger intelligent contract on GenLayer studionet.",
    "match_confirmed": true
  }
  ```

---

### 4. `list_commitments_by_registrant(registrant: str, limit: int) -> str`

Discovery view designed for frontends to list all commitments created by an address.

- **Type**: Read Call (View)
- **Parameters**:
  - `registrant` (`str`): Hex address of the registrant.
  - `limit` (`int`): Maximum number of records to return (most recent first).
- **Response Shape**: Array of commitment objects (JSON string).

---

## Error Messages Reference

All user errors are raised via `gl.vm.UserError`:
- `"empty raw_text"`: Text provided to `register_commitment` is empty.
- `"raw_text exceeds 400 characters"`: Input text exceeds maximum length.
- `"commitment not found"`: Queried `commitment_id` does not exist in storage.
- `"commitment already resolved"`: Attempting to resolve a commitment whose status is not `OPEN`.
- `"empty evidence_text"`: Text provided to `submit_resolution` is empty.
- `"evidence_text exceeds 1500 characters"`: Input evidence exceeds maximum length.
- `"evidence does not match this commitment"`: Consensus validators agree that the submitted evidence addresses a different subject/action or is a superficial distractor. Open state is preserved.
