# Integration Guide: CommitmentLedger

This document details how client applications and future dApps can integrate with the hardened `CommitmentLedger` Intelligent Contract on GenLayer studionet.

## Contract Coordinates

- **Network**: GenLayer Studionet (Preview)
- **Chain ID**: `61999`
- **RPC URL**: `https://studio.genlayer.com/api`
- **Explorer URL**: `https://explorer-studio.genlayer.com/address/0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1`
- **Contract Address**: `0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1`
- **genlayer-js version**: `1.1.8`
- **Chain Object**: `chains.studionet`

### Superseded Deployments

| Address | Deploy Tx Hash | Superseded Note |
| :--- | :--- | :--- |
| `0x8a5269aa724E77D799b3F0dbbaeee7683157f52d` | `0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b` | Superseded by v2.1.0: removed ungrounded fallback and enforced mandatory calendar date deadlines. |
| `0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3` | `0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235` | Initial caller-written text prototype, superseded by source-URL allowlisted resolution (Option A). |

---

## Public Methods & View Specifications

### 1. `register_commitment(raw_text: str, deadline_hint: str) -> str`

Registers a public commitment with immediate multi-validator canonical extraction of `{subject, action}`.

- **Type**: Write Transaction (Consensus)
- **Parameters**:
  - `raw_text` (`str`): The commitment statement (non-empty, <= 400 characters). Enclosed in `<UNTRUSTED_TEXT>` delimiters during processing.
  - `deadline_hint` (`str`): Mandatory strict calendar date formatted as `YYYY-MM-DD` (calendar days and leap years strictly validated).
- **Returns**: `commitment_id` (12 hex characters string).
- **Measured Latency**: 12.03s – 26.17s.
- **Example Call (`genlayer-js`)**:
  ```javascript
  const txHash = await client.writeContract({
    address: '0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1',
    functionName: 'register_commitment',
    args: [
      "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.",
      "1970-01-01"
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
  - Contract verifies `current_date >= deadline_hint` via deterministic clock.
  - Contract fetches page text and bounds it to the first 6,000 characters.
  - Evaluates semantic equivalence against registered `{subject, action}`.
  - If source does not match, transaction reverts with user error: `"source does not match this commitment"`.
  - Classifies outcome (`KEPT`, `BROKEN`, `PARTIAL`).
  - Verifies grounded verbatim quote (>= 12 chars). If ungrounded, reverts with `"no grounded quote in source"`, leaving commitment `OPEN`.
- **Measured Latency**: 15.00s – 38.15s.
- **Example Call (`genlayer-js`)**:
  ```javascript
  const txHash = await client.writeContract({
    address: '0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1',
    functionName: 'submit_resolution',
    args: [
      "bd37d1fb57d3",
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
    "schema_version": "2.1.0",
    "commitment_id": "bd37d1fb57d3",
    "registrant": "0xf8223276B10B629a175899cc136A31e2114DC798",
    "raw_text": "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.",
    "deadline_hint": "1970-01-01",
    "created_round": 1,
    "status": "RESOLVED",
    "outcome": "KEPT",
    "source_url": "https://en.wikipedia.org/wiki/Apollo_11",
    "resolution_quote": "Apollo 11 (July 16–24, 1969) was the American spaceflight that first landed humans on the Moon",
    "match_confirmed": true,
    "resolved_at": "2026-10-11T17:01:48.668817Z",
    "resolver": "0xf8223276B10B629a175899cc136A31e2114DC798"
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
- `"deadline_hint must be YYYY-MM-DD"`: Date is missing, non-ISO, or fails calendar date/leap year checks.
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
- `"clock unavailable"`: Deterministic message clock is unavailable or malformed.
- `"cannot resolve before deadline date"`: `current_date < deadline_hint`.
- `"source fetch failed"`: Web retrieval of the target URL returned empty or failed.
- `"source does not match this commitment"`: Validators agreed that the fetched source text is a distractor or describes a different subject/action. Open state is preserved.
- `"no grounded quote in source"`: LLM produced an ungrounded or sub-12-character quote. Open state is preserved.
