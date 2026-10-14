# CommitmentLedger Intelligent Contract

Standalone Intelligent Contract running on GenLayer studionet that registers public commitments and verifies natural language resolution evidence through multi-validator consensus using allowlisted public source URLs, defeating paraphrase-dodging while rejecting superficially-similar distractors.

## Status

- **Network**: GenLayer Studionet (Chain ID `61999`, RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`). Status is Preview.
- **Contract Address**: [`0xdD0d120B50ED65400E8b6a060bB15103B42544E8`](https://explorer-studio.genlayer.com/address/0xdD0d120B50ED65400E8b6a060bB15103B42544E8)
- **Deploy Transaction Hash**: [`0x9ddb3a96c40d222c8e4ac1b781029a3b6c33937796aa1348a060f4ea9ba14467`](https://explorer-studio.genlayer.com/tx/0x9ddb3a96c40d222c8e4ac1b781029a3b6c33937796aa1348a060f4ea9ba14467)
- **Source SHA-256**: `e14342dac8a0bdb983d4796557a59d3ae0e47e0715b9290d46cf3986cae1ac9c`
- **Schema Version**: `3.0.0`
- **SDK**: `genlayer-js` v1.1.8 (`chains.studionet`)

## What It Does

`CommitmentLedger` tracks public commitments (e.g. roadmap pledges, governance promises, public targets) without holding funds, requiring collateral, or relying on caller-authored evidence.

1. **Temporal Authenticity Classification**: Callers register commitment text alongside a mandatory calendar date deadline (`YYYY-MM-DD`). The contract compares the deadline to the current registration date. Commitments with future deadlines are tagged as `PROSPECTIVE` (`record_class: "ACCOUNTABILITY"`). Historical claims with deadlines on or before the registration date require an explicit `retrospective_ack=True` flag and are tagged as `RETROSPECTIVE` (`record_class: "RECORD_KEEPING"`), preventing past accomplishments from masquerading as forward-looking commitments.
2. **Claim Kind and Identity Attribution**: Callers must declare whether the commitment is `SELF_DECLARED` or a `THIRD_PARTY_REPORT`. The contract explicitly flags `identity_verified: false` to remind downstream systems that on-chain accounts are pseudonymous and off-chain identities are not verified by the ledger.
3. **Element-Based Adjudication of Full Statement**: Rather than evaluating isolated summary phrases, validators decompose the full raw statement into atomic elements (`ACTION`, `CONDITION`, `DEADLINE`). Each element is individually verified against retrieved evidence. Under the conjunction rule, a commitment is marked `KEPT` if and only if every element is `SATISFIED`. If any element is `NOT_SATISFIED`, the outcome is `BROKEN`. If key elements cannot be confirmed from the source, the transaction reverts as inconclusive, leaving the commitment `OPEN`.
4. **Deterministic Window Selection & Evidence Fingerprints**: When inspecting allowlisted public sources (`wikipedia.org`, `reuters.com`, `apnews.com`, `bbc.com`, `nasa.gov`, `noaa.gov`, `ecb.europa.eu`), validators inspect up to 12,000 characters using deterministic keyword window selection. Each decision records a SHA-256 fingerprint of the inspected text to ensure evidence integrity.
5. **Bounded Challenge & Reconsideration State Machine**: Initial resolution places the commitment in `PROVISIONAL` status with a bounded challenge window (120 seconds on Studionet). During this period, any party may challenge the decision with a structured reason code (`UNSUPPORTED_CLASSIFICATION`, `UNADDRESSED_ELEMENT`, `SOURCE_MISMATCH`, `SOURCE_MISATTRIBUTION`). A challenge triggers an independent re-review under strict grounding rules. If the challenge exposes ungrounded claims, the decision is withdrawn and the commitment reverts to `OPEN`. If unchallenged before the window expires, `finalize_resolution` locks the decision permanently into "FINALIZED" status.

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
const CONTRACT_ADDRESS = "0xdD0d120B50ED65400E8b6a060bB15103B42544E8";

// 1. Read commitment
const recordJson = await client.readContract({
  address: CONTRACT_ADDRESS,
  functionName: "get_commitment",
  args: ["3d2cc5901dad"],
});
console.log(JSON.parse(recordJson));

// 2. Read decision history
const historyJson = await client.readContract({
  address: CONTRACT_ADDRESS,
  functionName: "get_decision_history",
  args: ["7a681e3ba0a4"],
});
console.log(JSON.parse(historyJson));
```

## API Reference

| Method | Type | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- | :--- |
| `register_commitment` | Write (Consensus) | `raw_text: str`, `deadline_hint: str`, `claim_kind: str = "SELF_DECLARED"`, `retrospective_ack: bool = False` | `commitment_id: str` | Registers commitment; validates calendar date `YYYY-MM-DD`; extracts canonical elements; enforces retrospective acknowledgement if deadline is not prospective. |
| `submit_resolution` | Write (Consensus) | `commitment_id: str`, `source_url: str` | `None` | Evaluates full statement against allowlisted source; records provisional decision with atomic elements and evidence SHA-256 fingerprint. Enforces `current_date >= deadline_hint`. |
| `challenge_resolution` | Write (Consensus) | `commitment_id: str`, `reason_code: str`, `rationale: str`, `countervailing_url: str = ""` | `None` | Challenges provisional decision within active challenge window; triggers strict re-adjudication; withdraws decision if grounding fails. |
| `finalize_resolution` | Write (Consensus) | `commitment_id: str` | `None` | Transitions provisional resolution to "FINALIZED" status once the challenge window has expired without an active reconsideration. |
| `get_commitment` | View (Read) | `commitment_id: str` | `str` (JSON) | Returns full commitment record (purely read-only). |
| `list_commitments_by_registrant` | View (Read) | `registrant: str`, `limit: int` | `str` (JSON array) | Discovery view returning recent commitments by an address without storage mutation. |
| `get_decision_history` | View (Read) | `commitment_id: str` | `str` (JSON array) | Returns complete audit trail of provisional and reconsideration decisions for a commitment. |

## Studionet On-Chain Evidence Summary

All transactions below were executed and accepted by validators on GenLayer Studionet (Preview) with contract `0xdD0d120B50ED65400E8b6a060bB15103B42544E8`.

### Core Scenarios

| Case | Commitment ID | Register Tx | Resolve Tx | Status | Result | Outcome | Source URL | Adjudication Details |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Case P1 (Genuine Prospective, OPEN)** | `3d2cc5901dad` | [`0x30883fec9e9135929dccc73857b461358606c74c6870ebc274562379c5c6382c`](https://explorer-studio.genlayer.com/tx/0x30883fec9e9135929dccc73857b461358606c74c6870ebc274562379c5c6382c) | None (Pending Maturity) | `ACCEPTED` | `SUCCESS` | `null` (status `OPEN`) | `https://en.wikipedia.org/wiki/List_of_spaceflight_launches_in_October%E2%80%93December_2026` | Forward-looking launch commitment. Classified as `PROSPECTIVE` (`ACCOUNTABILITY`). Matures on 2026-10-16. |
| **Case A (Paraphrased Source, KEPT)** | `d569fda4e876` | [`0x6899aa4400c42c606b80a570deceec0105179c83dd2e783eae11202ef81eab38`](https://explorer-studio.genlayer.com/tx/0x6899aa4400c42c606b80a570deceec0105179c83dd2e783eae11202ef81eab38) | [`0xd379123921e3f89d9e360ca8c7913d748c82f58f897cf08dd6b1490588eb449f`](https://explorer-studio.genlayer.com/tx/0xd379123921e3f89d9e360ca8c7913d748c82f58f897cf08dd6b1490588eb449f) | `ACCEPTED` | `SUCCESS` | `KEPT` | `https://en.wikipedia.org/wiki/Apollo_11` | Elements e1 (Action), e2 (Condition), e3 (Deadline) all `SATISFIED`. Evidence grounded with SHA-256 fingerprint. |
| **Case B (Contradicted Action, BROKEN)** | `9875a6cdef6d` | [`0xf2ce034fcf4b7b8598330d81944b7f315a18024cc44e64882b872096a1cdbf5a`](https://explorer-studio.genlayer.com/tx/0xf2ce034fcf4b7b8598330d81944b7f315a18024cc44e64882b872096a1cdbf5a) | [`0x0684f543bf5e95f6f1656150a03ca8fa2dbb7409d74e7bfbf3559347a973acbc`](https://explorer-studio.genlayer.com/tx/0x0684f543bf5e95f6f1656150a03ca8fa2dbb7409d74e7bfbf3559347a973acbc) | `ACCEPTED` | `SUCCESS` | `BROKEN` | `https://en.wikipedia.org/wiki/Apollo_13` | Action e1 ("land on lunar surface") marked `NOT_SATISFIED` due to mission abort; outcome correctly determined as `BROKEN`. |
| **Case C (Condition Omitted in Summary, BROKEN)** | `ec77538d32e9` | [`0x0b7176db894ee47fb8805667d4d1a38ddce4b3c4917f09a4c735b2e59eb524d2`](https://explorer-studio.genlayer.com/tx/0x0b7176db894ee47fb8805667d4d1a38ddce4b3c4917f09a4c735b2e59eb524d2) | [`0x724098f2fa4c497274c3c29ab60083eed8012adf7866a45b8af36356d72081b5`](https://explorer-studio.genlayer.com/tx/0x724098f2fa4c497274c3c29ab60083eed8012adf7866a45b8af36356d72081b5) | `ACCEPTED` | `SUCCESS` | `BROKEN` | `https://en.wikipedia.org/wiki/Apollo_11` | Compound condition "all three astronauts on lunar surface" evaluated; e2 marked `NOT_SATISFIED` (Collins remained in orbit). |
| **Case D (Missed Deadline, Inconclusive Revert, OPEN)** | `a0d3d1ba6356` | [`0x019162a6722dbfe94c96050be14ecd773fa8ca8026175f508f668416107e146b`](https://explorer-studio.genlayer.com/tx/0x019162a6722dbfe94c96050be14ecd773fa8ca8026175f508f668416107e146b) | [`0xbfd05f848dd5bf898b9089a877f37edbb4a179fbc971884c5e752f04bec9e177`](https://explorer-studio.genlayer.com/tx/0xbfd05f848dd5bf898b9089a877f37edbb4a179fbc971884c5e752f04bec9e177) | `ACCEPTED` | `ERROR` | `null` (status `OPEN`) | `https://en.wikipedia.org/wiki/Apollo_11` | Claim asserted landing before July 1, 1969; transaction reverted as inconclusive, preserving commitment as `OPEN`. |

### On-Chain Negative Rejection Tests

All revert payloads below were retrieved via JSON-RPC `eth_getTransactionByHash` and decoded from the leader receipt result field:

| Test | Submitted Parameter | Transaction Hash | Status Name | Leader Result | Revert Payload |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Retrospective Without Ack | `1969-07-20` without ack | [`0xa025fb40394d752a2bf3f79cf0e66d7755daecf8daf8f2b530f001964e41db72`](https://explorer-studio.genlayer.com/tx/0xa025fb40394d752a2bf3f79cf0e66d7755daecf8daf8f2b530f001964e41db72) | `ACCEPTED` | `ERROR` | `"deadline is not after registration date; set retrospective_ack to record a historical claim"` |
| Invalid Claim Kind | `"UNOFFICIAL"` | [`0xd565b19a8a3f2c453b146d7399741655cbe54be11cc5ccb8b248d9777f0b5bf4`](https://explorer-studio.genlayer.com/tx/0xd565b19a8a3f2c453b146d7399741655cbe54be11cc5ccb8b248d9777f0b5bf4) | `ACCEPTED` | `ERROR` | `"claim_kind must be SELF_DECLARED or THIRD_PARTY_REPORT"` |
| Premature Resolution | `2099-01-01` before deadline | [`0x4b210b3ab195d8765ece9e8b0ac0bd9f9ed7bc8fc3606bc7c5bc71ec6cd9171e`](https://explorer-studio.genlayer.com/tx/0x4b210b3ab195d8765ece9e8b0ac0bd9f9ed7bc8fc3606bc7c5bc71ec6cd9171e) | `ACCEPTED` | `ERROR` | `"cannot resolve before deadline date"` |
| Distractor Source Rejection | Falcon 9 article for Apollo | [`0x1d4132b76b6a33f156ea4f66efd32015ea04612cf754666c3b349d89d11e2011`](https://explorer-studio.genlayer.com/tx/0x1d4132b76b6a33f156ea4f66efd32015ea04612cf754666c3b349d89d11e2011) | `ACCEPTED` | `ERROR` | `"source does not match this commitment"` |
| Non-Allowlisted Domain | `https://github.com/nasa/webb` | [`0xe9a3457e57ff0da66c9fe7a0e569c489c05e6b00cda0bea8f2b98be45376f4a3`](https://explorer-studio.genlayer.com/tx/0xe9a3457e57ff0da66c9fe7a0e569c489c05e6b00cda0bea8f2b98be45376f4a3) | `ACCEPTED` | `ERROR` | `"source_url domain not in authorized allowlist"` |
| Challenge While Open | Challenge on unadjudicated claim | [`0xb56ab310f04b61d9d9b10ad5d8b1d51252880eb250dec912300af265f7e6d3e4`](https://explorer-studio.genlayer.com/tx/0xb56ab310f04b61d9d9b10ad5d8b1d51252880eb250dec912300af265f7e6d3e4) | `ACCEPTED` | `ERROR` | `"commitment is not in provisional status"` |
| Finalize While Open | Finalize on unadjudicated claim | [`0x73acc08da9391f0597ef8f27c8911bce5772bf713e141f0a88a45146a3bd8ced`](https://explorer-studio.genlayer.com/tx/0x73acc08da9391f0597ef8f27c8911bce5772bf713e141f0a88a45146a3bd8ced) | `ACCEPTED` | `ERROR` | `"commitment is not in provisional status"` |
| Early Finalize | Finalize before window expires | [`0xa74ba93acb13951a376e9ff7359b27b9f879800db7cceecdba63865836d83fcd`](https://explorer-studio.genlayer.com/tx/0xa74ba93acb13951a376e9ff7359b27b9f879800db7cceecdba63865836d83fcd) | `ACCEPTED` | `ERROR` | `"challenge window still open"` |

### Challenge State Machine & Decisions History

An on-chain multi-step dispute flow was executed on Studionet with commitment `7a681e3ba0a4`:
- **Registration**: [`0x346a956c5fe359f299ec5a34cdff42e9e8507d2c597070e557cd9de2f278b70c`](https://explorer-studio.genlayer.com/tx/0x346a956c5fe359f299ec5a34cdff42e9e8507d2c597070e557cd9de2f278b70c)
- **Initial Resolution**: [`0x575654d453a323b23676c9e1b0d7dde251e752e132dcea7d285aaaf904a2e778`](https://explorer-studio.genlayer.com/tx/0x575654d453a323b23676c9e1b0d7dde251e752e132dcea7d285aaaf904a2e778) -> Decision 1: `PROVISIONAL`, `KEPT`.
- **Early Finalize Attempt**: [`0xa74ba93acb13951a376e9ff7359b27b9f879800db7cceecdba63865836d83fcd`](https://explorer-studio.genlayer.com/tx/0xa74ba93acb13951a376e9ff7359b27b9f879800db7cceecdba63865836d83fcd) -> Reverted with `"challenge window still open"`.
- **Challenge 1 (`UNSUPPORTED_CLASSIFICATION`)**: [`0x137dda2a6d1770410dfd93dd7ef0e6e3d850bd19ed12a6b82bf831a4dc6baff8`](https://explorer-studio.genlayer.com/tx/0x137dda2a6d1770410dfd93dd7ef0e6e3d850bd19ed12a6b82bf831a4dc6baff8) -> Strict grounding re-review determined the claim unverified -> Decision marked `WITHDRAWN`, commitment returned safely to `OPEN`.

For detailed evidence JSON records and receipts, see [docs/EVIDENCE.md](docs/EVIDENCE.md). For source code verification, see [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Trust Model & Limitations

1. **Who Can Register and Resolve**: Any address can register a commitment (`raw_text <= 400` chars, strict calendar date `YYYY-MM-DD`). Once the deadline date is reached, any address can submit a resolution with an allowlisted public source URL. Callers cannot provide self-written evidence text.
2. **State Machine Lifecycle**: A resolution remains `PROVISIONAL` during the challenge window. Once concluded, the status becomes "FINALIZED" and cannot be re-adjudicated.
3. **Source Text Bound**: The contract deterministically selects keyword-relevant windows from retrieved web text (up to 12,000 characters) to fit within LLM context bounds and ensure deterministic multi-validator consensus.
4. **Throwaway Account**: Transactions in this repository were signed using an automated throwaway dev account holding studionet GEN with zero real-world value.
5. **External Source Scope**: The contract does not verify ultimate real-world truth beyond what allowlisted public sources assert at resolution time. It does not monitor external web pages for retroactive revisions.

## Repository Layout

```text
.
├── contracts/
│   ├── CommitmentLedger.py    # Standalone Intelligent Contract (SCHEMA 3.0.0)
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
│   │   ├── run_challenge_flow.js      # Challenge & dispute flow runner
│   │   ├── run_evidence.js            # Automated evidence runner
│   │   └── verification_result.json   # JSON-RPC verification output
│   └── tools/
│       ├── decode_revert.js           # Revert payload decoder CLI
│       ├── read_commitment.js         # On-chain commitment reader CLI
│       └── render_evidence_md.js      # Evidence markdown generator
└── tests/                             # Python unit test suite
```

## Superseded Deployments

The following contracts were deployed during development and have been superseded:

| Address | Deploy Transaction Hash | Superseded Reason |
| :--- | :--- | :--- |
| `0x3155c7c80f4334968d61E1b79f74EB864CF7cb08` | [`0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a`](https://explorer-studio.genlayer.com/tx/0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a) | Superseded by v3.0.0: answered steward review with temporal authenticity, element-based adjudication of full original statement, claim kind/identity unverified, bounded challenge & reconsideration state machine, and sha256 evidence fingerprints. |
| `0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1` | [`0x9b738652bceac390143a01f7dcf7ca24b7a92714430d950c34f9ae2936de4f52`](https://explorer-studio.genlayer.com/tx/0x9b738652bceac390143a01f7dcf7ca24b7a92714430d950c34f9ae2936de4f52) | Superseded by v2.2.0: could write PARTIAL when model returned no valid outcome. |
| `0x8a5269aa724E77D799b3F0dbbaeee7683157f52d` | [`0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b`](https://explorer-studio.genlayer.com/tx/0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b) | Superseded by v2.1.0: removed ungrounded fallback and enforced mandatory calendar date deadlines. |
| `0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3` | [`0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235`](https://explorer-studio.genlayer.com/tx/0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235) | Initial caller-written text prototype, superseded by source-based resolution. |

## License

MIT License. Copyright (c) 2026 Hyper (`huzyow155`).
