# CommitmentLedger Intelligent Contract

Standalone Intelligent Contract running on GenLayer studionet that registers public commitments and verifies natural language resolution evidence through multi-validator consensus, defeating paraphrase-dodging while rejecting superficially-similar distractors.

## The Problem: Paraphrase-Dodging

Public commitments (a DAO steward's roadmap promise, a project's stated deadline, an executive's public pledge) are easily dodged by restating them in different wording later (*"I never said Q2, I said 'this half of the year'"*).

- **Exact string / hash matching** is trivially defeated by paraphrase: any synonym change, passive-to-active conversion, or reordered clause breaks the linkage entirely.
- **Unconstrained LLM oracles** fail consensus because divergent phrasing produces non-deterministic reasoning.
- **Naive fuzzy matching** conflates superficial distractors (same subject, different action/timeline) with actual fulfillments.

## Why GenLayer?

`CommitmentLedger` leverages GenLayer's **Optimistic Democracy** and `gl.eq_principle.strict_eq`:
1. **Canonical Extraction at Registration**: When a commitment is registered, consensus validators extract a normalized canonical predicate (`subject`, `action`), storing it on-chain.
2. **Semantic Equivalence at Resolution**: Anyone can submit evidence. Validators verify whether the evidence semantically addresses the exact same commitment (`MATCH` vs `NOMATCH`).
3. **Deterministic Outcome Gate**:
   - If validators agree the evidence does **not** match (`NOMATCH`), the transaction raises `UserError("evidence does not match this commitment")`, leaving the commitment open.
   - If evidence matches, the outcome is scored (`KEPT`, `BROKEN`, `PARTIAL`).
   - A grounded verbatim quote (>= 12 characters) is strictly enforced: an ungrounded or hallucinated quote forces `PARTIAL`, never a confident `KEPT` or `BROKEN`.

## Contract Coordinates (GenLayer Studionet)

- **Network**: GenLayer Studionet (Preview)
- **Contract Address**: [`0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3`](https://explorer-studio.genlayer.com/address/0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3)
- **Deploy Transaction**: [`0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235`](https://explorer-studio.genlayer.com/tx/0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235)
- **Chain ID**: `61999`
- **RPC URL**: `https://studio.genlayer.com/api`
- **Explorer Base**: `https://explorer-studio.genlayer.com`
- **SDK**: `genlayer-js` v1.1.8 (`chains.studionet`)

## API Specification

| Method | Type | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- | :--- |
| `register_commitment` | Write (Consensus) | `raw_text: str`, `deadline_hint: str` | `commitment_id: str` | Registers commitment; extracts canonical `{subject, action}` via consensus. |
| `submit_resolution` | Write (Consensus) | `commitment_id: str`, `evidence_text: str` | `None` | Semantic match verification and grounded outcome classification. |
| `get_commitment` | View (Read) | `commitment_id: str` | `str` (JSON) | Returns full commitment record. |
| `list_commitments_by_registrant` | View (Read) | `registrant: str`, `limit: int` | `str` (JSON array) | Discovery view returning recent commitments by an address. |

## Studionet Deployment & Verification Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suite
```bash
python -m unittest discover tests
```

### 3. Run Quality Scans
```bash
python scripts/scan_ascii.py
python scripts/scan_banned_words.py
python scripts/scan_secrets.py
```

### 4. Deploy Contract to Studionet
```bash
node scripts/deploy/deploy_core.js
```

### 5. Verify Source on Studionet
```bash
node scripts/verify_source.js
```

## Trap Test & On-Chain Evidence Summary

All 4 required scenarios were executed on GenLayer studionet with verifiable receipts:

1. **Case A (The Trap Test - KEPT via Genuine Paraphrase)**:
   - *Original*: `"Hyper commits to ship the decentralized commitment ledger on studionet by Q4 2026."`
   - *Evidence (Paraphrase)*: `"Public announcement: As of October 2026, Hyper has successfully deployed and verified the decentralized commitment ledger intelligent contract on GenLayer studionet."`
   - *Result*: `KEPT` (Resolved via Tx `0x33d45785766d3a1bcdc23d42750506e9d5f294967c3d98e0b13c5dee1457f72e`, status `ACCEPTED`).
2. **Case B (BROKEN with Grounded Quote)**:
   - *Original*: `"The core engineering guild will publish the formal verification specification by September 15 2026."`
   - *Evidence*: `"Guild meeting minutes: Due to unexpected resource constraints, the core engineering guild formally missed the deadline and failed to publish the formal verification specification."`
   - *Result*: `BROKEN` (Resolved via Tx `0xa5ef4273019f16edffdf0bd929dd423bc692c5d5b141345193250b08b0f4f024`, status `ACCEPTED`).
3. **Case C (Correctly Rejected NOMATCH Distractor)**:
   - *Original*: `"Hyper promises to conduct a community gas subsidy audit by October 2026."`
   - *Distractor Evidence*: `"Community bulletin: Hyper successfully organized an in-person developer hackathon in Berlin during October 2026."` (Same subject 'Hyper' and October timeframe, but completely different action).
   - *Result*: Tx `0xab04171bfeb77ba94c1dc5902fbf1334aa5bcd80a07f8b9cfe77715d879f5d50` rejected with rollback `payload: "evidence does not match this commitment"`. State remains `OPEN`.
4. **Case D (PARTIAL Outcome from Ambiguous Evidence)**:
   - *Original*: `"The security team will finalize 100 percent of the vulnerability bounty payouts by November 2026."`
   - *Evidence*: Ambiguous payout status.
   - *Result*: `PARTIAL` (Resolved via Tx `0x98dc864a5fa63547f6343ed3cc0a3ceda9779eb099a5531129c560a439bc7f92`, status `ACCEPTED`).

## Known Limitations

- **String Length Limits**: Input texts are capped at 400 characters for commitments and 1,500 characters for resolution evidence to preserve deterministic validator execution bounds.
- **Single Registrant**: A commitment belongs to a single registrant address; multi-sig or co-sponsored commitments require aggregate credentials.
- **Non-Financial Ledger**: The contract holds no funds, tokens, or financial penalties; it functions as a transparent on-chain accountability and reputation ledger.
- **LLM Consensus Latency**: Natural language multi-validator consensus transactions take approximately 15 to 35 seconds per round on studionet.

## License

MIT License. Copyright (c) 2026 Hyper (`huzyow155`).
