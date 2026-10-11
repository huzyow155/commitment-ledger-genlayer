# CommitmentLedger Intelligent Contract

Standalone Intelligent Contract running on GenLayer studionet that registers public commitments and verifies natural language resolution evidence through multi-validator consensus using allowlisted public source URLs, defeating paraphrase-dodging while rejecting superficially-similar distractors.

## Status

- **Network**: GenLayer Studionet (Chain ID `61999`, RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`). Status is Preview.
- **Contract Address**: [`0x3155c7c80f4334968d61E1b79f74EB864CF7cb08`](https://explorer-studio.genlayer.com/address/0x3155c7c80f4334968d61E1b79f74EB864CF7cb08)
- **Deploy Transaction Hash**: [`0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a`](https://explorer-studio.genlayer.com/tx/0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a)
- **Source SHA-256**: `fe63f0cc5a5788e2e3199919ddb5ee067c4c19c17389a8a250764f8e5299016f`
- **Schema Version**: `2.2.0`
- **SDK**: `genlayer-js` v1.1.8 (`chains.studionet`)

## What It Does

`CommitmentLedger` tracks public commitments (e.g. roadmap pledges, governance promises, public targets) without holding funds, requiring collateral, or relying on caller-authored evidence.

1. **Extraction at Registration**: Callers register commitment text alongside a mandatory calendar date deadline (`YYYY-MM-DD`). Validators execute canonical extraction via `strict_eq`, isolating normalized `{subject, action}` fields stored directly on-chain. Input text is safely enclosed in `<UNTRUSTED_TEXT>` delimiters to protect against prompt injection.
2. **Allowlisted Source Resolution**: Once the deadline date is reached (`current_date >= deadline_hint` via deterministic clock), any caller can trigger resolution by submitting an allowlisted public source URL (`wikipedia.org`, `reuters.com`, `apnews.com`, `bbc.com`, `nasa.gov`, `noaa.gov`, `ecb.europa.eu`). The contract fetches and evaluates the first 6,000 characters of the page directly.
3. **Strict Non-Overlapping Verification Cascade**:
   - **Distractor Rejection (`NOMATCH`)**: If the fetched page text describes a different subject or event, validators agree on `NOMATCH`. The call reverts with `UserError("source does not match this commitment")`, keeping the commitment `OPEN`.
   - **Invalid Outcome Rejection (`INVALID`)**: If the model matches the topic but fails to produce a recognized outcome (`KEPT`, `BROKEN`, `PARTIAL`), the transaction reverts with `UserError("model returned no valid outcome")`, keeping the commitment `OPEN`.
   - **Ungrounded Quote Rejection (`UNGROUNDED`)**: If the model asserts an outcome but the supporting quote is under 12 characters or not a verbatim substring of the fetched source, the transaction reverts with `UserError("no grounded quote in source")`, keeping the commitment `OPEN`.
   - **Match Acceptance (`MATCH`)**: Only when the source matches, the outcome is valid, and the verbatim quote is verified does the record transition to `RESOLVED` with permanent outcome and quote.

## Quick Start

### Installation & Test Suite

```bash
npm install
npm test
npm run check
```

`npm run check` runs the full verification pipeline: unit tests, ASCII scans, banned word audits, secrets inspection, and evidence consistency assertions.

### Interacting with Contract

```javascript
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const client = createClient({ chain: studionet, endpoint: "https://studio.genlayer.com/api" });
const CONTRACT_ADDRESS = "0x3155c7c80f4334968d61E1b79f74EB864CF7cb08";

// 1. Read commitment
const recordJson = await client.readContract({
  address: CONTRACT_ADDRESS,
  functionName: "get_commitment",
  args: ["1fe69a47c557"],
});
console.log(JSON.parse(recordJson));
```

## API Reference

| Method | Type | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- | :--- |
| `register_commitment` | Write (Consensus) | `raw_text: str`, `deadline_hint: str` | `commitment_id: str` | Registers commitment; validates strict calendar date `YYYY-MM-DD`; extracts canonical `{subject, action}` via consensus. |
| `submit_resolution` | Write (Consensus) | `commitment_id: str`, `source_url: str` | `None` | Semantic match verification and grounded quote classification from allowlisted source URL. Enforces `current_date >= deadline_hint`. |
| `get_commitment` | View (Read) | `commitment_id: str` | `str` (JSON) | Returns full commitment record (purely read-only). |
| `list_commitments_by_registrant` | View (Read) | `registrant: str`, `limit: int` | `str` (JSON array) | Discovery view returning recent commitments by an address without storage mutation. |

## Studionet On-Chain Evidence Summary

All transactions below were executed and accepted on GenLayer Studionet (Preview) with contract `0x3155c7c80f4334968d61E1b79f74EB864CF7cb08`.

### Core Scenarios

| Case | Commitment ID | Register Tx | Resolve Tx | Status | Result | Outcome | Source URL | Grounded Quote |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Case A (Paraphrased Source, KEPT)** | `1fe69a47c557` | [`0xd61b234967a1011ec915b56afeae573fb4bd54192f5ad1358fd82a90d1737abd`](https://explorer-studio.genlayer.com/tx/0xd61b234967a1011ec915b56afeae573fb4bd54192f5ad1358fd82a90d1737abd) | [`0x54b64f75cd22ef47ac2adecc71ee1e37dd95869c75ea7a274a7c6424e8b715c5`](https://explorer-studio.genlayer.com/tx/0x54b64f75cd22ef47ac2adecc71ee1e37dd95869c75ea7a274a7c6424e8b715c5) | `ACCEPTED` | `SUCCESS` | `KEPT` | `https://en.wikipedia.org/wiki/Apollo_11` | `"Apollo 11 (July 16–24, 1969) was the American spaceflight that first landed humans on the Moon"` |
| **Case B (Grounded Quote, BROKEN)** | `605aa94797d3` | [`0xae2cd4b15272a53eaf11d6d3fb9fc5200610ddf170c494672f81c42cd7333823`](https://explorer-studio.genlayer.com/tx/0xae2cd4b15272a53eaf11d6d3fb9fc5200610ddf170c494672f81c42cd7333823) | [`0xf04a899cfb85a62e958a7e378b063026f21811726c8f8a612c7fbf080a85e943`](https://explorer-studio.genlayer.com/tx/0xf04a899cfb85a62e958a7e378b063026f21811726c8f8a612c7fbf080a85e943) | `ACCEPTED` | `SUCCESS` | `BROKEN` | `https://en.wikipedia.org/wiki/Apollo_13` | `"the landing was aborted after an oxygen tank in the service module (SM) exploded two days into the mission"` |
| **Case C (Distractor Rejection, NOMATCH)** | `4efe7cbd0772` | [`0x588c25fb25bbb86c235943ae06a9dcfd7523238e1d177be731bad1244c7baec2`](https://explorer-studio.genlayer.com/tx/0x588c25fb25bbb86c235943ae06a9dcfd7523238e1d177be731bad1244c7baec2) | [`0x7dda2fcd83a02ce8d34fc451d3ff5bff18129ea078cc4a1d31776e1f73b74a59`](https://explorer-studio.genlayer.com/tx/0x7dda2fcd83a02ce8d34fc451d3ff5bff18129ea078cc4a1d31776e1f73b74a59) | `ACCEPTED` | `ERROR` | `null` (status `OPEN`) | `https://en.wikipedia.org/wiki/Falcon_9` | Reverted with `"source does not match this commitment"`, commitment preserved `OPEN` |

### On-Chain Negative Rejection Tests

All revert payloads below were retrieved via JSON-RPC `eth_getTransactionByHash` and decoded from the leader receipt result field:

| Test | Submitted Parameter | Transaction Hash | Status Name | Leader Result | Revert Payload |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Non-Allowlisted Domain | `https://github.com/nasa/webb` | [`0x5700f1c0b10574950bf94bd8b6fa5b8a19774fdc6d5e1b35c9c5f51712362516`](https://explorer-studio.genlayer.com/tx/0x5700f1c0b10574950bf94bd8b6fa5b8a19774fdc6d5e1b35c9c5f51712362516) | `ACCEPTED` | `ERROR` | `"source_url domain not in authorized allowlist"` |
| Insecure Scheme | `http://en.wikipedia.org/wiki/Falcon_9` | [`0x39b53afc63f6280205fc802b6edc9716878fa1ed73e1677aace2cbf89caef1ef`](https://explorer-studio.genlayer.com/tx/0x39b53afc63f6280205fc802b6edc9716878fa1ed73e1677aace2cbf89caef1ef) | `ACCEPTED` | `ERROR` | `"source_url scheme must be https"` |
| Free-Text Deadline | `"end of Q2"` | [`0x334a98052827dae100223ef13febac25f35b7ed06a766435e1bbb8f9730ede43`](https://explorer-studio.genlayer.com/tx/0x334a98052827dae100223ef13febac25f35b7ed06a766435e1bbb8f9730ede43) | `ACCEPTED` | `ERROR` | `"deadline_hint must be YYYY-MM-DD"` |
| Premature Resolution | `2099-01-01` before deadline | [`0xbf92e012a6ba8d58288b1138d4b66be0f6a25cef8364ce7d19d2639bfee8c11a`](https://explorer-studio.genlayer.com/tx/0xbf92e012a6ba8d58288b1138d4b66be0f6a25cef8364ce7d19d2639bfee8c11a) | `ACCEPTED` | `ERROR` | `"cannot resolve before deadline date"` |
| Already Resolved | Resolution on `1fe69a47c557` | [`0x909b41a144f8469f9983e103aee508601a6b499e1ef6db5ac1ea759906e2c5d2`](https://explorer-studio.genlayer.com/tx/0x909b41a144f8469f9983e103aee508601a6b499e1ef6db5ac1ea759906e2c5d2) | `ACCEPTED` | `ERROR` | `"commitment already resolved"` |

### Scope of On-Chain Testing vs Unit Test Coverage

- **PARTIAL Outcome**: On this deployment, resolving a compound statement regarding Apollo 13 resulted in validator disagreement (`UNDETERMINED` / `MAJORITY_DISAGREE`) across three studionet attempts, keeping the commitment `OPEN`. The evidence records these attempts transparently in `partialAttempts`. The `PARTIAL` resolution path is fully exercised and verified in mocked unit tests (`test_partial_fulfillment_with_grounded_quote` in `tests/test_layer2_mocked.py`).
- **UNGROUNDED and INVALID Branches**: In on-chain testing against real Wikipedia sources, validators either identified verbatim quotes within the initial 6,000 characters or classified the source as a distractor (`NOMATCH`), reverting with `"source does not match this commitment"`. The ungrounded quote branch (`"no grounded quote in source"`) and invalid model outcome branch (`"model returned no valid outcome"`) are thoroughly exercised by unit tests in `tests/test_c1_edge_cases.py` and `tests/test_layer2_mocked.py`.

For comprehensive JSON records and read-back details, see [docs/EVIDENCE.md](docs/EVIDENCE.md). For source code match verification, see [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Trust Model & Limitations

1. **Who Can Register and Resolve**: Any address can register a commitment (`raw_text <= 400` chars, strict calendar date `YYYY-MM-DD`). Once the deadline date is reached, any address can submit a resolution with an allowlisted public source URL. Callers cannot provide self-written evidence text.
2. **Permanent State**: Once a commitment transitions to `RESOLVED`, the outcome is permanent and cannot be modified or re-resolved.
3. **Source Text Bound**: The contract truncates retrieved web text to the first 6,000 characters to ensure consensus determinism and fit within LLM context bounds. Information appearing after character 6,000 will not be evaluated.
4. **Throwaway Account**: Transactions in this repository were signed using an automated throwaway dev account holding studionet GEN with zero real-world value.
5. **External Source Scope**: The contract does not verify ultimate real-world truth beyond what the allowlisted public source asserts at the time of resolution. It does not monitor external pages for retroactive revisions.

## Repository Layout

```text
.
├── contracts/
│   ├── CommitmentLedger.py    # Standalone Intelligent Contract (SCHEMA 2.2.0)
│   └── Probe.py               # Runtime probe for platform primitives
├── docs/
│   ├── DESIGN.md              # Architectural design and consensus cascade
│   ├── EVIDENCE.md            # Complete on-chain evidence with read-backs
│   ├── INTEGRATION.md         # Client and future dApp integration guide
│   ├── PRIOR_ART.md           # Prior art analysis and landscape comparison
│   ├── RUNTIME_NOTES.md       # Probe results and platform observations
│   └── VERIFICATION.md        # Byte-for-byte on-chain source hash verification
├── scripts/
│   ├── check_evidence_consistency.py  # Evidence structure and hash format validation
│   ├── scan_ascii.py                  # ASCII character validator
│   ├── scan_banned_words.py           # Banned marketing/jargon scanner
│   ├── scan_secrets.py                # Secret leakage detection scanner
│   ├── verify_source.js               # On-chain contract source code verification script
│   ├── deploy/
│   │   ├── deploy.js                  # Deployment script
│   │   ├── deployments.json           # Active and superseded deployment records
│   │   ├── live_evidence.json         # Raw on-chain transaction evidence
│   │   ├── run_evidence.js            # Automated evidence runner
│   │   └── verification_result.json   # JSON-RPC verification output
│   └── tools/
│       ├── decode_revert.js           # Revert payload decoder CLI
│       ├── read_commitment.js         # On-chain commitment reader CLI
│       └── render_evidence_md.js      # Evidence markdown generator
└── tests/                             # Python unit test suite (30 passing tests)
```

## Superseded Deployments

The following contracts were deployed during development and have been superseded:

| Address | Deploy Transaction Hash | Superseded Reason |
| :--- | :--- | :--- |
| `0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1` | [`0x9b738652bceac390143a01f7dcf7ca24b7a92714430d950c34f9ae2936de4f52`](https://explorer-studio.genlayer.com/tx/0x9b738652bceac390143a01f7dcf7ca24b7a92714430d950c34f9ae2936de4f52) | Superseded by v2.2.0: could write PARTIAL when model returned no valid outcome. |
| `0x8a5269aa724E77D799b3F0dbbaeee7683157f52d` | [`0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b`](https://explorer-studio.genlayer.com/tx/0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b) | Superseded by v2.1.0: removed ungrounded fallback and enforced mandatory calendar date deadlines. |
| `0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3` | [`0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235`](https://explorer-studio.genlayer.com/tx/0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235) | Initial caller-written text prototype, superseded by source-based resolution. |

## License

MIT License. Copyright (c) 2026 Hyper (`huzyow155`).
