# Integration Guide: CommitmentLedger

This document details how client applications and future dApps can integrate with the hardened `CommitmentLedger` Intelligent Contract on GenLayer studionet.

## Contract Coordinates

- **Network**: GenLayer Studionet (Preview)
- **Chain ID**: `61999`
- **RPC URL**: `https://studio.genlayer.com/api`
- **Explorer URL**: `https://explorer-studio.genlayer.com/address/0x8a5269aa724E77D799b3F0dbbaeee7683157f52d`
- **Contract Address**: `0x8a5269aa724E77D799b3F0dbbaeee7683157f52d`
- **genlayer-js version**: `1.1.8`
- **Chain Object**: `chains.studionet`

### Superseded Deployments

| Address | Deploy Tx Hash | Superseded Note |
| :--- | :--- | :--- |
| `0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3` | `0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235` | Initial caller-written text prototype, superseded by source-URL allowlisted resolution (Option A). |

---

## Public Methods & View Specifications

### 1. `register_commitment(raw_text: str, deadline_hint: str) -> str`

Registers a public commitment with immediate multi-validator canonical extraction of `{subject, action}`.

- **Type**: Write Transaction (Consensus)
- **Parameters**:
  - `raw_text` (`str`): The commitment statement (non-empty, <= 400 characters). Enclosed in `<UNTRUSTED_TEXT>` delimiters during processing.
  - `deadline_hint` (`str`): Target date (YYYY-MM-DD) or milestone description (<= 60 characters).
- **Returns**: `commitment_id` (12 hex characters string).
- **Measured Latency**: 12.03s – 25.12s.
- **Example Call (`genlayer-js`)**:
  ```javascript
  const txHash = await client.writeContract({
    address: '0x8a5269aa724E77D799b3F0dbbaeee7683157f52d',
    functionName: 'register_commitment',
    args: [
      "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.",
      "none"
    ],
  });
  ```

---

### 2. `submit_resolution(commitment_id: str, source_url: str) -> None`

Submits an allowlisted public source URL that the Intelligent Contract fetches and evaluates directly via `gl.nondet.web.render`.

- **Type**: Write Transaction (Consensus)
- **Parameters**:
  - `commitment_id` (`str`): 12-hex character ID of an open commitment.
  - `source_url` (`str`): Allowlisted HTTPS URL (<= 300 characters, no userinfo, default 443 port).
- **Allowlisted Domains**:
  - `wikipedia.org`, `reuters.com`, `apnews.com`, `bbc.com`, `nasa.gov`, `noaa.gov`, `ecb.europa.eu`.
- **Consensus Behavior**:
  - Contract fetches page text and bounds it to the first 6,000 characters.
  - Evaluates semantic equivalence against registered `{subject, action}`.
  - If source does not match, transaction reverts with user error: `"evidence does not match this commitment"`.
  - Classifies outcome (`KEPT`, `BROKEN`, `PARTIAL`).
  - Verifies grounded verbatim quote (>= 12 chars). An ungrounded quote forces `PARTIAL`.
- **Measured Latency**: 15.00s – 38.15s.
- **Example Call (`genlayer-js`)**:
  ```javascript
  const txHash = await client.writeContract({
    address: '0x8a5269aa724E77D799b3F0dbbaeee7683157f52d',
    functionName: 'submit_resolution',
    args: [
      "8a63544a69ae",
      "https://en.wikipedia.org/wiki/Apollo_11"
    ],
  });
  ```

---

### 3. `get_commitment(commitment_id: str) -> str`

Retrieves a serialized JSON representation of a commitment record.

- **Type**: Read Call (View, purely read-only)
- **Parameters**: `commitment_id` (`str`).
- **Response Shape**:
  ```json
  {
    "schema_version": "2.0.0",
    "commitment_id": "8a63544a69ae",
    "registrant": "0x4aA4504eE1540949001e7cE94C1245ba40710980",
    "raw_text": "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.",
    "subject": "apollo 11 mission",
    "action": "land human astronauts on the lunar surface before 1970",
    "deadline_hint": "none",
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

---

### 4. `list_commitments_by_registrant(registrant: str, limit: int) -> str`

Discovery view designed for frontends to list all commitments created by an address without modifying contract storage.

- **Type**: Read Call (View, purely read-only)
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
- `"empty source_url"`: URL provided to `submit_resolution` is empty.
- `"source_url exceeds maximum length of 300 characters"`: URL exceeds length bound.
- `"source_url cannot contain whitespace"`: URL contains space, tab, or newline.
- `"source_url scheme must be https"`: Protocol scheme is not https.
- `"source_url hostname is missing"`: URL lacks hostname.
- `"source_url cannot contain userinfo"`: URL contains username/password.
- `"source_url port must be 443 or omitted"`: URL specifies non-standard port.
- `"source_url hostname must be pure ASCII"`: URL contains non-ASCII domain characters.
- `"source_url hostname cannot be punycode"`: URL uses punycode `xn--`.
- `"source_url hostname cannot be an IP address"`: URL uses an IPv4 or IPv6 address literal.
- `"source_url domain not in authorized allowlist"`: Domain is not in the fixed allowlist.
- `"source fetch failed"`: Web retrieval of the target URL returned empty or failed.
- `"cannot resolve before deadline date"`: `deadline_hint` contains an ISO date that has not arrived yet.
- `"evidence does not match this commitment"`: Validators agreed that the fetched source text is a distractor or describes a different subject/action. Open state is preserved.
